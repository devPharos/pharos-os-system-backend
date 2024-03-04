import { Headers, Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const getProjectsBodySchema = z.object({
  clientid: z.string().uuid(),
});

type GetProjectsBodySchema = z.infer<typeof getProjectsBodySchema>;

interface Project {
  clientId: string;
  collaborator: {
    id: string;
    name: string;
  };
  companyId: string;
  coordinatorId: string;
  deliveryForecast: Date;
  endDate: Date | null;
  hourValue: string;
  hoursBalance: string | null;
  hoursForecast: string | null;
  name: string;
  serviceOrderDetails: { serviceOrder: { totalHours: string } }[];
  startDate: Date;
  status: string;
}

interface BilledProject extends Project {
  hoursToBeBilled: number;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class GetProjectsDataController {
  constructor(private prisma: PrismaService) {}
  @Get("/projects")
  @HttpCode(201)
  async handle(@Headers() header: GetProjectsBodySchema) {
    const { clientid } = header;

    const projects: Project[] = await this.prisma.project.findMany({
      where: {
        clientId: clientid,
      },
      include: {
        collaborator: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            fantasyName: true,
          },
        },
        serviceOrderDetails: {
          where: {
            serviceOrder: {
              status: {
                equals: "Validado",
              },
            },
          },
          select: {
            serviceOrder: {
              select: {
                totalHours: true,
              },
            },
          },
        },
      },
    });

    let hoursToBeBilled = 0;

    const newProjects: BilledProject[] = [];

    projects.forEach((project) => {
      project.serviceOrderDetails.forEach((os) => {
        hoursToBeBilled += Number(os.serviceOrder.totalHours);
      });
      const newProject = {
        ...project,
        hoursToBeBilled,
      };

      newProjects.push(newProject);
    });

    return {
      projects: newProjects,
    };
  }
}
