import {
  Controller,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import { format } from "date-fns";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const findProjectSchema = z.object({
  id: z.string().uuid(),
});

type FindProjectSchema = z.infer<typeof findProjectSchema>;

@Controller("/find")
@UseGuards(JwtAuthGuard)
export class FindProjectController {
  constructor(private prisma: PrismaService) {}
  @Get("/project")
  @HttpCode(201)
  async handle(@Headers() header: FindProjectSchema) {
    const { id } = header;

    const project = await this.prisma.project.findUnique({
      where: {
        id,
      },
      select: {
        client: {
          select: {
            id: true,
            fantasyName: true,
          },
        },
        coordinatorId: true,
        clientId: true,
        name: true,
        startDate: true,
        endDate: true,
        deliveryForecast: true,
        hoursForecast: true,
        hoursBalance: true,
        hourValue: true,
        projectsExpenses: {
          select: {
            id: true,
            description: true,
            value: true,
            requireReceipt: true,
          },
          where: {
            projectId: id,
          },
        },
        projectsServices: {
          select: {
            id: true,
            description: true,
            chargesClient: true,
            passCollaborator: true,
          },
          where: {
            projectId: id,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException("Project not found.");
    }

    return {
      ...project,
      startDate: format(project.startDate, "yyyy-MM-dd"),
      deliveryForecast: project?.deliveryForecast
        ? format(project?.deliveryForecast || 0, "yyyy-MM-dd")
        : null,
      endDate: project?.endDate
        ? format(project?.endDate || 0, "yyyy-MM-dd")
        : null,
    };
  }
}
