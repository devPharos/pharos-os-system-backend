import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { differenceInHours } from "date-fns";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const serviceOrderProjectExpenses = z.object({
  id: z.string().uuid(),
  serviceOrderExpenseId: z.string().uuid(),
  description: z.string(),
  value: z.string(),
});

const serviceOrderProject = z.object({
  id: z.string().uuid(),
  projectsExpenses: z.array(serviceOrderProjectExpenses),
});

const serviceOrderProjectService = z.object({
  id: z.string().uuid(),
  description: z.string(),
});

const serviceOrderDetails = z.object({
  id: z.string().uuid(),
  description: z.string(),
  endDate: z.string(),
  startDate: z.string(),
  project: serviceOrderProject,
  projectServices: serviceOrderProjectService,
});

const updateServiceOrderBodySchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  date: z.coerce.date(),
  serviceType: z.enum(["Presencial", "Remoto"]),
  status: z.enum(["Aberto", "Rascunho"]),
  serviceOrderDetails: z.array(serviceOrderDetails),
});

type UpdateServiceOrderBodySchema = z.infer<
  typeof updateServiceOrderBodySchema
>;

@Controller("/update")
@UseGuards(JwtAuthGuard)
export class UpdateServiceOrderController {
  constructor(private prisma: PrismaService) {}
  @Put("/service-order")
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(updateServiceOrderBodySchema))
    body: UpdateServiceOrderBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { date, serviceOrderDetails, clientId, serviceType, status, id } =
      body;
    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: user.sub,
      },
    });

    const startDate = serviceOrderDetails.sort((a, b) => {
      return (
        parseDate(a.startDate, date).getTime() -
        parseDate(b.startDate, date).getTime()
      );
    })[0].startDate;

    const endDate = serviceOrderDetails.sort((a, b) => {
      return (
        parseDate(b.endDate, date).getTime() -
        parseDate(a.endDate, date).getTime()
      );
    })[0].endDate;

    const totalHours = differenceInHours(
      parseDate(endDate, date),
      parseDate(startDate, date),
    ).toString();

    const serviceOrder = await this.prisma.serviceOrder.update({
      where: {
        id,
      },
      data: {
        endDate: parseDate(endDate, date),
        startDate: parseDate(startDate, date),
        status,
        totalHours,
        clientId,
        collaboratorId: collaborator?.id || "",
        companyId: collaborator?.companyId || "",
        date,
        remote: serviceType !== "Presencial",
      },
    });

    serviceOrderDetails.map(async (detail) => {
      await this.prisma.serviceOrderDetails.upsert({
        where: {
          id: detail.id,
        },
        update: {
          description: detail.description,
          endDate: parseDate(detail.endDate, date),
          startDate: parseDate(detail.startDate, date),
          projectId: detail.project.id,
          companyId: collaborator?.companyId || "",
          serviceOrderId: serviceOrder.id,
          projectServiceId: detail.projectServices.id,
        },
        create: {
          description: detail.description,
          endDate: parseDate(detail.endDate, date),
          startDate: parseDate(detail.startDate, date),
          projectId: detail.project.id,
          companyId: collaborator?.companyId || "",
          serviceOrderId: serviceOrder.id,
          projectServiceId: detail.projectServices.id,
        },
      });

      detail.project.projectsExpenses.map(async (expense) => {
        await this.prisma.serviceOrderExpenses.upsert({
          where: {
            id: expense.serviceOrderExpenseId,
          },
          update: {
            value: expense.value,
            projectExpenseId: expense.id,
            serviceOrderId: serviceOrder.id,
            projectId: detail.project.id,
            companyId: collaborator?.companyId || "",
          },
          create: {
            value: expense.value,
            projectExpenseId: expense.id,
            serviceOrderId: serviceOrder.id,
            projectId: detail.project.id,
            companyId: collaborator?.companyId || "",
          },
        });
      });
    });

    return "updated";
  }
}

const parseDate = (date: string, fullDate: Date): Date => {
  const newDate = new Date(fullDate);
  const [hour, minute] = date.split(":");
  const minutes = parseInt(hour, 10) * 60 + parseInt(minute, 10);
  newDate.setMinutes(minutes - newDate.getTimezoneOffset() + 180);
  const parsedDate = newDate;

  return parsedDate;
};
