import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const createSupportTicketBodySchema = z.object({
  message: z.string(),
  userId: z.string().uuid(),
  supportId: z.string().uuid(),
});

type CreateSupportTicketBodySchema = z.infer<
  typeof createSupportTicketBodySchema
>;

@Controller("/ticket")
@UseGuards(JwtAuthGuard)
export class CreateTicketMessageController {
  constructor(private prisma: PrismaService) {}
  @Post("/message")
  async handle(
    @Body(new ZodValidationPipe(createSupportTicketBodySchema))
    body: CreateSupportTicketBodySchema,
  ) {
    const { message, supportId, userId } = body;

    await this.prisma.supportMessage.create({
      data: {
        message,
        supportId,
        userId,
      },
    });

    const messages = await this.prisma.supportMessage.findMany({
      where: {
        supportId,
      },
      select: {
        id: true,
        message: true,
        user: {
          select: {
            id: true,
            client: {
              select: {
                id: true,
                fantasyName: true,
              },
            },
            collaborator: {
              select: {
                id: true,
                name: true,
                lastName: true,
              },
            },
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return messages;
  }
}
