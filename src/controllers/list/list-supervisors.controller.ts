import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";

import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/list")
@UseGuards(JwtAuthGuard)
export class ListSupervisorsController {
  constructor(private prisma: PrismaService) {}
  @Get("/supervisors")
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

    const supervisors = await this.prisma.collaborator.findMany({
      where: {
        AND: [
          {
            companyId: company?.companyId,
          },
          {
            userId: {
              not: user.sub,
            },
          },
        ],
      },
      select: {
        id: true,
        userId: true,
        name: true,
        lastName: true,
      },
    });

    return supervisors;
  }
}
