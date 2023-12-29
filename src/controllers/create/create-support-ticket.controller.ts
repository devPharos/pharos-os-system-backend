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
  helper: z.enum([
    "Desenvolvimento",
    "Suporte",
    "Infraestrutura",
    "Modulos",
    "Faturamento",
  ]),
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
    const { collaboratorId, message, priority, projectId, title, helper } =
      body;

    const client = await this.prisma.client.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    const pj = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        clientId: true,
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
        helperTopic: helper,
        collaborator: {
          connect: {
            id: collaboratorId,
          },
        },
        company: {
          connect: {
            id: client ? client.companyId : pj?.companyId,
          },
        },
        endDate,
        project: {
          connect: {
            id: projectId,
          },
        },
        client: {
          connect: {
            id: client ? client.id : pj?.clientId,
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
