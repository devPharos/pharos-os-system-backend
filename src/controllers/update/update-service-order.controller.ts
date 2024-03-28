import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { differenceInHours, parse, parseISO } from "date-fns";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

export const serviceOrderExpenses = z.object({
  id: z.string().uuid().optional(),
  projectExpenseId: z.string().uuid(),
  value: z.string(),
});

const serviceOrderDetails = z.object({
  id: z.string().uuid().optional(),
  description: z.string(),
  endDate: z.string(),
  startDate: z.string(),
  projectServiceId: z.string().uuid(),
  projectId: z.string().uuid(),
  expenses: z.array(serviceOrderExpenses),
});

const updateServiceOrderBodySchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  date: z.string(),
  serviceType: z.enum(["Presencial", "Remoto"]),
  status: z.enum(["Aberto", "Rascunho"]),
  details: z.array(serviceOrderDetails),
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
    const { date, details, clientId, serviceType, status, id } = body;
    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: user.sub,
      },
    });

    const startDate = details.sort((a, b) => {
      return (
        parse(a.startDate, "HH:mm", parseISO(date)).getTime() -
        parse(b.startDate, "HH:mm", parseISO(date)).getTime()
      );
    })[0].startDate;

    const endDate = details.sort((a, b) => {
      return (
        parse(b.endDate, "HH:mm", parseISO(date)).getTime() -
        parse(a.endDate, "HH:mm", parseISO(date)).getTime()
      );
    })[0].endDate;

    const totalHours = differenceInHours(
      parse(endDate, "HH:mm", parseISO(date)),
      parse(startDate, "HH:mm", parseISO(date)),
    ).toString();

    const serviceOrder = await this.prisma.serviceOrder.update({
      where: {
        id,
      },
      data: {
        endDate: parse(endDate, "HH:mm", parseISO(date)),
        startDate: parse(startDate, "HH:mm", parseISO(date)),
        status,
        totalHours,
        clientId,
        collaboratorId: collaborator?.id || "",
        companyId: collaborator?.companyId || "",
        date: parseISO(date),
        remote: serviceType !== "Presencial",
      },
    });

    details.map(async (detail) => {
      const newEndDate = parse(detail.endDate, "HH:mm", parseISO(date));
      const newStartDate = parse(detail.startDate, "HH:mm", parseISO(date));

      if (detail.id) {
        await this.prisma.serviceOrderDetails.update({
          where: {
            id: detail.id,
          },
          data: {
            description: detail.description,
            endDate: newEndDate,
            startDate: newStartDate,
            projectId: detail.projectId,
            companyId: collaborator?.companyId || "",
            serviceOrderId: serviceOrder.id,
            projectServiceId: detail.projectServiceId,
          },
        });
      } else {
        await this.prisma.serviceOrderDetails.create({
          data: {
            description: detail.description,
            endDate: newEndDate,
            startDate: newStartDate,
            projectId: detail.projectId,
            companyId: collaborator?.companyId || "",
            serviceOrderId: serviceOrder.id,
            projectServiceId: detail.projectServiceId,
          },
        });
      }

      detail.expenses.map(async (expense) => {
        if (expense.id) {
          await this.prisma.serviceOrderExpenses.update({
            where: {
              id: expense.id,
            },
            data: {
              value: expense.value,
              projectExpenseId: expense.projectExpenseId,
              serviceOrderId: serviceOrder.id,
              projectId: detail.projectId,
              companyId: collaborator?.companyId || "",
            },
          });
        } else {
          await this.prisma.serviceOrderExpenses.create({
            data: {
              value: expense.value,
              projectExpenseId: expense.projectExpenseId,
              serviceOrderId: serviceOrder.id,
              projectId: detail.projectId,
              companyId: collaborator?.companyId || "",
            },
          });
        }
      });
    });

    return "updated";
  }
}
