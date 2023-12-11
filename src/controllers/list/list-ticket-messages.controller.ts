import { Controller, Get, Headers, HttpCode, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";

import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const listSupportTicketsSchema = z.object({
  id: z.string().uuid(),
});

type ListSupportTicketsSchema = z.infer<typeof listSupportTicketsSchema>;

@Controller("/ticket")
@UseGuards(JwtAuthGuard)
export class ListSupportTicketsMessagesController {
  constructor(private prisma: PrismaService) {}
  @Get()
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
    @Headers() headers: ListSupportTicketsSchema,
  ) {
    const { id } = headers;

    const ticket = await this.prisma.support.findUnique({
      where: {
        id,
      },
      select: {
        collaborator: {
          select: {
            id: true,
            name: true,
            lastName: true,
          },
        },
        status: true,
        priority: true,
        endDate: true,
        client: {
          select: {
            id: true,
            fantasyName: true,
          },
        },
        SupportMessage: {
          select: {
            id: true,
            message: true,
            user: {
              select: {
                id: true,
                collaborator: {
                  select: {
                    name: true,
                    lastName: true,
                    id: true,
                  },
                },
                client: {
                  select: {
                    id: true,
                    fantasyName: true,
                  },
                },
                company: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
          },
          where: {
            supportId: id,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return ticket;
  }
}
