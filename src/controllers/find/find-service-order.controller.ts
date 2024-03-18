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
import {
  ServiceOrderDetails,
  ServiceOrderExpenses,
} from "../create/create-service-order.controller";

const findServiceOrderSchema = z.object({
  id: z.string().uuid(),
});

type FindServiceOrderSchema = z.infer<typeof findServiceOrderSchema>;

@Controller("/find")
@UseGuards(JwtAuthGuard)
export class FindServiceOrderController {
  constructor(private prisma: PrismaService) {}
  @Get("/service-order")
  @HttpCode(201)
  async handle(@Headers() header: FindServiceOrderSchema) {
    const { id } = header;

    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: {
        id,
      },
      select: {
        client: {
          select: {
            id: true,
            fantasyName: true,
            cnpj: true,
          },
        },
        remote: true,
        date: true,
        clientId: true,
        serviceOrderExpenses: {
          select: {
            id: true,
            projectId: true,
            value: true,
            projectExpenseId: true,
          },
          where: {
            serviceOrderId: id,
          },
        },
        serviceOrderDetails: {
          select: {
            id: true,
            projectServiceId: true,
            projectId: true,
            startDate: true,
            endDate: true,
            description: true,
          },
          where: {
            serviceOrderId: id,
          },
        },
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException("Service order not found.");
    }

    const details: ServiceOrderDetails[] = [];

    for (const detail of serviceOrder.serviceOrderDetails) {
      const expenses: ServiceOrderExpenses[] = [];

      const project = await this.prisma.project.findUnique({
        where: {
          id: detail.projectId,
        },
        select: {
          name: true,
          projectsServices: {
            select: {
              description: true,
            },
            where: {
              id: detail.projectServiceId,
            },
          },
        },
      });

      for (const expense of serviceOrder.serviceOrderExpenses) {
        const projectExpense = await this.prisma.projectExpenses.findUnique({
          where: {
            id: expense.projectExpenseId,
          },
          select: {
            id: true,
          },
        });
        if (expense.projectId === detail.projectId) {
          const newExpense: ServiceOrderExpenses = {
            value: expense.value,
            projectExpenseId: projectExpense?.id ?? "",
          };

          expenses.push(newExpense);
        }
      }

      const newDetail: ServiceOrderDetails = {
        description: detail.description,
        endDate: format(detail.endDate, "HH:mm"),
        startDate: format(detail.startDate, "HH:mm"),
        projectServiceId: detail.projectServiceId,
        projectId: detail.projectId,
        project: {
          name: project?.name ?? "",
          service: {
            description: project?.projectsServices[0].description ?? "",
          },
        },
        expenses,
      };

      details.push(newDetail);
    }

    return {
      clientId: serviceOrder.clientId,
      serviceType: serviceOrder.remote ? "Remoto" : "Presencial",
      date: format(serviceOrder.date, "yyyy-MM-dd"),
      details,
    };
  }
}
