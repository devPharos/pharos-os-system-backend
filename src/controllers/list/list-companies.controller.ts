import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class ListCompaniesController {
  constructor(private prisma: PrismaService) {}
  @Get("/companies")
  @HttpCode(201)
  async handle() {
    const companies = await this.prisma.company.findMany();

    return companies;
  }
}
