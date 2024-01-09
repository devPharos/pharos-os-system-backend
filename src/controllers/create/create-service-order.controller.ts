import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { differenceInHours } from "date-fns";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const serviceOrderProjectExpenses = z.object({
  id: z.string().uuid(),
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
  description: z.string(),
  endDate: z.string(),
  startDate: z.string(),
  project: serviceOrderProject,
  projectServices: serviceOrderProjectService,
});

const createServiceOrderBodySchema = z.object({
  clientId: z.string().uuid(),
  date: z.coerce.date(),
  serviceType: z.enum(["Presencial", "Remoto"]),
  status: z.enum(["Aberto", "Rascunho"]),
  serviceOrderDetails: z.array(serviceOrderDetails),
});

type CreateServiceOrderBodySchema = z.infer<
  typeof createServiceOrderBodySchema
>;

@Controller("/service-order")
@UseGuards(JwtAuthGuard)
export class CreateServiceOrderController {
  constructor(private prisma: PrismaService) {}
  @Post()
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createServiceOrderBodySchema))
    body: CreateServiceOrderBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { date, serviceOrderDetails, clientId, serviceType, status } = body;
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

    const serviceOrderWithSameHour = await this.prisma.serviceOrder.findMany({
      where: {
        OR: [
          {
            startDate: parseDate(startDate, date),
            endDate: parseDate(endDate, date),
          },
        ],
      },
    });

    const serviceOrderDetailWithSameHour = serviceOrderDetails.some(
      async (detail) => {
        const hasSameHour = await this.prisma.serviceOrderDetails.findMany({
          where: {
            OR: [
              {
                startDate: parseDate(detail.startDate, date),
                endDate: parseDate(detail.endDate, date),
              },
            ],
          },
        });

        if (hasSameHour) {
          return true;
        }

        return false;
      },
    );

    if (serviceOrderWithSameHour || serviceOrderDetailWithSameHour) {
      throw new ConflictException("Ja existe uma OS nesse horário");
    }

    const serviceOrder = await this.prisma.serviceOrder.create({
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
      await this.prisma.serviceOrderDetails.create({
        data: {
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
        await this.prisma.serviceOrderExpenses.create({
          data: {
            value: expense.value,
            projectExpenseId: expense.id,
            serviceOrderId: serviceOrder.id,
            projectId: detail.project.id,
            companyId: collaborator?.companyId || "",
          },
        });
      });
    });

    return "created";
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
