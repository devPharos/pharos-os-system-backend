import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { parseISO } from "date-fns";
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
  startDate: z.string(),
  endDate: z.string().optional(),
  deliveryForecast: z.string().optional(),
  hoursForecast: z.string().optional(),
  hoursBalance: z.string().optional(),
  hourValue: z.string(),
  projectsExpenses: projectExpensesFormSchema.array(),
  projectsServices: projectServicesFormSchema.array(),
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
      projectsExpenses,
      projectsServices,
    } = body;

    const newEndDate = endDate ? parseISO(endDate) : null;
    const newDeliveryForecast = deliveryForecast
      ? parseISO(deliveryForecast)
      : null;

    await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        clientId,
        coordinatorId,
        deliveryForecast: newDeliveryForecast,
        endDate: newEndDate,
        hourValue,
        hoursBalance,
        hoursForecast,
        name,
        startDate: parseISO(startDate),
      },
    });

    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
      },
    });

    if (projectsExpenses?.length > 0) {
      projectsExpenses?.map(async (newExpense) => {
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

    if (projectsServices?.length > 0) {
      projectsServices.map(async (service) => {
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
