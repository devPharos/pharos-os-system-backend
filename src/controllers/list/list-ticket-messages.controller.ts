import { Controller, Get, Headers, HttpCode, UseGuards } from "@nestjs/common";
import { format } from "date-fns";
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
        title: true,
        helperTopic: true,
        status: true,
        priority: true,
        endDate: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            fantasyName: true,
          },
        },
        supportMessages: {
          select: {
            id: true,
            message: true,
            createdAt: true,
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

    const endDate = format(ticket?.endDate || 0, "yyyy-MM-dd");
    return {
      ...ticket,
      endDate,
    };
  }
}
