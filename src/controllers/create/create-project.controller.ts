import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const projectExpensesFormSchema = z.object({
  description: z.string().min(1),
  value: z.string().min(1),
  requireReceipt: z.boolean().default(false),
});

const projectServicesFormSchema = z.object({
  description: z.string().min(1),
  chargesClient: z.boolean().default(false),
  passCollaborator: z.boolean().default(false),
});

const createProjectBodySchema = z.object({
  clientId: z.string().uuid(),
  coordinatorId: z.string().uuid(),
  name: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  deliveryForecast: z.string(),
  hoursForecast: z.string(),
  hoursBalance: z.string().optional(),
  hourValue: z.string(),
  projectExpenses: projectExpensesFormSchema.array(),
  projectServices: projectServicesFormSchema.array(),
});

type CreateProjectBodySchema = z.infer<typeof createProjectBodySchema>;

@Controller("/projects")
@UseGuards(JwtAuthGuard)
export class CreateProjectController {
  constructor(private prisma: PrismaService) {}
  @Post()
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createProjectBodySchema))
    body: CreateProjectBodySchema,
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
      startDate,
      projectExpenses,
      projectServices,
    } = body;

    const client = await this.prisma.client.findUnique({
      where: {
        id: clientId,
      },
    });

    const newEndDate = endDate || null;

    const project = await this.prisma.project.create({
      data: {
        deliveryForecast,
        endDate: newEndDate,
        hourValue,
        hoursBalance,
        hoursForecast,
        name,
        startDate,
        company: {
          connect: { id: client?.companyId },
        },
        client: {
          connect: { id: clientId },
        },
        collaborator: {
          connect: { id: coordinatorId },
        },
      },
    });

    projectExpenses.forEach(
      async (expense) =>
        await this.prisma.projectExpenses.create({
          data: {
            description: expense.description,
            value: expense.value,
            company: {
              connect: { id: project.companyId },
            },
            project: {
              connect: { id: project.id },
            },
            requireReceipt: expense.requireReceipt,
          },
        }),
    );

    projectServices.forEach(
      async (service) =>
        await this.prisma.projectService.create({
          data: {
            description: service.description,
            chargesClient: service.chargesClient,
            company: {
              connect: { id: project.companyId },
            },
            project: {
              connect: { id: project.id },
            },
            passCollaborator: service.passCollaborator,
          },
        }),
    );
  }
}
