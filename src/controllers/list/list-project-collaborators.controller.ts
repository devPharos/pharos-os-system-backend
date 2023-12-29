import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";

import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/list/project")
@UseGuards(JwtAuthGuard)
export class ListProjectCollaboratorsController {
  constructor(private prisma: PrismaService) {}
  @Get("/collaborators")
  @HttpCode(201)
  async handle(@CurrentUser() user: UserPayload) {
    const company = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
      },
      select: {
        companyId: true,
      },
    });

    const collaborators = await this.prisma.collaborator.findMany({
      where: {
        companyId: company?.companyId,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        lastName: true,
      },
    });

    return collaborators;
  }
}
