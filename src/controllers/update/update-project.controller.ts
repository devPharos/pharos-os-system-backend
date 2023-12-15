import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const projectExpensesFormSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  value: z.string().min(1),
  requireReceipt: z.boolean().default(false),
});

const projectServicesFormSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  chargesClient: z.boolean().default(false),
  passCollaborator: z.boolean().default(false),
});

const updateProjectSchema = z.object({
  projectId: z.string().uuid(),
  clientId: z.string().uuid(),
  coordinatorId: z.string().uuid(),
  name: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  deliveryForecast: z.string(),
  hoursForecast: z.string(),
  hoursBalance: z.string(),
  hourValue: z.string(),
  projectExpenses: projectExpensesFormSchema.array(),
  projectServices: projectServicesFormSchema.array(),
});

type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;

@Controller("/update")
@UseGuards(JwtAuthGuard)
export class UpdateProjectController {
  constructor(private prisma: PrismaService) {}
  @Put("/project")
  @HttpCode(201)
  async handle(
    @Body() body: UpdateProjectSchema,
    @CurrentUser() user: UserPayload,
  ) {
    const {
      clientId,
      coordinatorId,
      deliveryForecast,
      endDate,
      hourValue,
      hoursBalance,
      hoursForecast,
      name,
      projectId,
      startDate,
      projectExpenses,
      projectServices,
    } = body;

    await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        clientId,
        coordinatorId,
        deliveryForecast,
        endDate,
        hourValue,
        hoursBalance,
        hoursForecast,
        name,
        startDate,
      },
    });

    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
      },
    });

    if (projectExpenses?.length > 0) {
      projectExpenses?.map(async (newExpense) => {
        if (newExpense.id) {
          await this.prisma.projectExpenses.update({
            where: {
              id: newExpense.id,
            },
            data: {
              description: newExpense.description,
              requireReceipt: newExpense.requireReceipt,
              value: newExpense.value,
            },
          });
        }

        if (!newExpense.id) {
          await this.prisma.projectExpenses.create({
            data: {
              description: newExpense.description,
              requireReceipt: newExpense.requireReceipt,
              value: newExpense.value,
              project: {
                connect: {
                  id: projectId,
                },
              },
              company: {
                connect: {
                  id: currentUser?.companyId,
                },
              },
            },
          });
        }
      });
    }

    if (projectServices?.length > 0) {
      projectServices.map(async (service) => {
        if (service.id) {
          await this.prisma.projectService.update({
            where: {
              id: service.id,
            },
            data: {
              chargesClient: service.chargesClient,
              description: service.description,
              passCollaborator: service.passCollaborator,
            },
          });
        }

        if (!service.id) {
          await this.prisma.projectService.create({
            data: {
              chargesClient: service.chargesClient,
              description: service.description,
              passCollaborator: service.passCollaborator,
              project: {
                connect: {
                  id: projectId,
                },
              },
              company: {
                connect: {
                  id: currentUser?.companyId,
                },
              },
            },
          });
        }
      });
    }
  }
}
