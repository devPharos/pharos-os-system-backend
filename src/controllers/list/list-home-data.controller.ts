import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { getMonth } from "date-fns";
import { CurrentUser } from "src/auth/current-user.decorator";

import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/list")
@UseGuards(JwtAuthGuard)
export class ListHomeDataController {
  constructor(private prisma: PrismaService) {}
  @Get("/home/data")
  @HttpCode(201)
  async handle(@CurrentUser() user: UserPayload) {
    const month = getMonth(new Date()) + 1;

    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const openTickets = await this.prisma.support.count({
      where: {
        collaboratorId: collaborator?.id,
        AND: {
          status: {
            equals: "NaoIniciado",
          },
        },
      },
    });

    const overdueTickets = await this.prisma.support.count({
      where: {
        collaboratorId: collaborator?.id,
        AND: {
          status: {
            equals: "Atraso",
          },
        },
      },
    });

    const inProgressTickets = await this.prisma.support.count({
      where: {
        collaboratorId: collaborator?.id,
        AND: {
          status: {
            equals: "Iniciado",
          },
        },
      },
    });

    const doneTickets = await this.prisma.support.count({
      where: {
        collaboratorId: collaborator?.id,
        AND: {
          status: {
            equals: "NaoIniciado",
          },
          endDate: {
            gte: new Date(2023, month - 1, 1),
            lt: new Date(2023, month, 1),
          },
        },
      },
    });

    return {
      openTickets,
      overdueTickets,
      inProgressTickets,
      doneTickets,
      name: collaborator?.name,
    };
  }
}
