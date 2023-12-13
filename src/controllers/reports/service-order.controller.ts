import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/report")
@UseGuards(JwtAuthGuard)
export class GetServiceOrderReportController {
  constructor(private prisma: PrismaService) {}
  @Get("/service-order")
  @HttpCode(201)
  async handle() {}
}
