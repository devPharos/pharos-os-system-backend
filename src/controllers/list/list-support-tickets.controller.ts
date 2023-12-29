import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";

import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/list")
@UseGuards(JwtAuthGuard)
export class ListSupportTicketsController {
  constructor(private prisma: PrismaService) {}
  @Get("/tickets")
  @HttpCode(201)
  async handle(@CurrentUser() user: UserPayload) {
    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
      },
    });

    const client = await this.prisma.client.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
      },
    });

    const clientTickets = await this.prisma.support.findMany({
      where: {
        clientId: client?.id,
        OR: [
          {
            collaboratorId: collaborator?.id,
          },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        helperTopic: true,
        client: {
          select: {
            id: true,
            fantasyName: true,
          },
        },
      },
    });

    const collaboratorTickets = await this.prisma.support.findMany({
      where: {
        collaboratorId: collaborator?.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        helperTopic: true,
        client: {
          select: {
            id: true,
            fantasyName: true,
          },
        },
      },
    });

    const tickets = client ? clientTickets : collaboratorTickets;

    return tickets;
  }
}
