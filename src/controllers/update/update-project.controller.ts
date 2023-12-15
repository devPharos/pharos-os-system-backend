import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
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
  async handle(@Body() body: UpdateProjectSchema) {
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

    projectExpenses.map(async (newExpense) => {
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
    });

    projectServices.map(async (service) => {
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
    });
  }
}
