import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class ListClientsController {
  constructor(private prisma: PrismaService) {}
  @Get("/clients")
  @HttpCode(201)
  async handle() {
    const clients = await this.prisma.client.findMany();

    return clients;
  }
}
