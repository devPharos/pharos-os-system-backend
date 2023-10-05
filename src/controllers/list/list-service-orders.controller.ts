import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { ServiceOrderDetails, ServiceOrderExpenses } from "@prisma/client";
import { ServiceOrder } from "src/@types/service-orders";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class ListServiceOrdersController {
  constructor(private prisma: PrismaService) {}
  @Get("/service-orders")
  @HttpCode(201)
  async handle() {
    const serviceOrders = await this.prisma.serviceOrder.findMany();
    const osList: ServiceOrder[] = [];

    await serviceOrders.forEach(async (os) => {
      const osDetails: ServiceOrderDetails[] =
        await this.prisma.serviceOrderDetails.findMany({
          where: { serviceOrderId: os.id },
        });
      const osExpenses: ServiceOrderExpenses[] =
        await this.prisma.serviceOrderExpenses.findMany({
          where: { serviceOrderId: os.id },
        });
      const collaborator = await this.prisma.collaborator.findUnique({
        where: { id: os.collaboratorId },
      });
      const client = await this.prisma.client.findUnique({
        where: { id: os.clientId },
      });

      const newOs = {
        id: os.id,
        client: client?.id || "",
        collaborator: collaborator?.id || "",
        status: os.status,
        date: os.date,
        startDate: os.startDate,
        endDate: os.endDate,
        osDetails,
        osExpenses,
      };

      osList.push(newOs);
    });

    return serviceOrders;
  }
}
