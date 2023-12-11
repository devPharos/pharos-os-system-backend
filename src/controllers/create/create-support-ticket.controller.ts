import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { add } from "date-fns";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const createSupportTicketBodySchema = z.object({
  message: z.string(),
  collaboratorId: z.string().uuid(),
  projectId: z.string().uuid(),
  priority: z.enum(["Alta", "Media", "Baixa"]),
  title: z.string(),
});

type CreateSupportTicketBodySchema = z.infer<
  typeof createSupportTicketBodySchema
>;

@Controller("/support")
@UseGuards(JwtAuthGuard)
export class CreateSupportTicketController {
  constructor(private prisma: PrismaService) {}
  @Post("/ticket")
  async handle(
    @Body(new ZodValidationPipe(createSupportTicketBodySchema))
    body: CreateSupportTicketBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { collaboratorId, message, priority, projectId, title } = body;

    const client = await this.prisma.client.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    const timeElapsed = Date.now();
    const today = new Date(timeElapsed);

    const endDate =
      priority === "Alta"
        ? add(today, {
            days: 5, // add 5 dias
          })
        : priority === "Media"
        ? add(today, {
            days: 10, // add 10 dias
          })
        : add(today, {
            days: 15, // add 15 dias
          });

    const supportTicket = await this.prisma.support.create({
      data: {
        title,
        priority,
        collaborator: {
          connect: {
            id: collaboratorId,
          },
        },
        client: {
          connect: {
            id: client?.id,
          },
        },
        company: {
          connect: {
            id: client?.companyId,
          },
        },
        endDate,
        project: {
          connect: {
            id: projectId,
          },
        },
      },
    });

    await this.prisma.supportMessage.create({
      data: {
        message,
        support: {
          connect: {
            id: supportTicket.id,
          },
        },
        user: {
          connect: {
            id: user.sub,
          },
        },
      },
    });

    return 201;
  }
}
