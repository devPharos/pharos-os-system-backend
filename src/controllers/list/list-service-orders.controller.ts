import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
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

    return serviceOrders;
  }
}
