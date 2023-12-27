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
            projectExpenses: {
              select: {
                id: true,
                requireReceipt: true,
                value: true,
                description: true,
              },
            },
          },
          where: {
            serviceOrderId: id,
          },
        },
        serviceOrderDetails: {
          select: {
            id: true,
            project: {
              select: {
                id: true,
                name: true,
                projectsExpenses: {
                  select: {
                    id: true,
                    requireReceipt: true,
                    value: true,
                    description: true,
                  },
                },
              },
            },
            projectServices: {
              select: {
                id: true,
                description: true,
              },
            },
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

    return {
      ...serviceOrder,
      fantasyName: serviceOrder.client.fantasyName,
      cnpj: serviceOrder.client.cnpj,
      date: format(serviceOrder.date, "yyyy-MM-dd"),
    };
  }
}
