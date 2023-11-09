import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/collaborators")
@UseGuards(JwtAuthGuard)
export class GetCollaboratorsController {
  constructor(private prisma: PrismaService) {}
  @Get()
  @HttpCode(201)
  async handle() {
    const collaborators = await this.prisma.collaborator.findMany({
      where: {
        userId: {
          equals: null,
        },
      },
    });

    return collaborators;
  }
}
