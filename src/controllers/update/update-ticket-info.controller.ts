import { Body, Controller, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const updateSupportTicketBodySchema = z.object({
  id: z.string().uuid(),
  collaboratorId: z.string().uuid("Selecione uma opção"),
  projectId: z.string().uuid("Selecione uma opção"),
  status: z.enum(["Atraso", "NaoIniciado", "Iniciado", "Finalizado"]),
  priority: z.enum(["Alta", "Media", "Baixa"]),
  helper: z.enum([
    "Desenvolvimento",
    "Suporte",
    "Infraestrutura",
    "Modulos",
    "Faturamento",
  ]),
  endDate: z.coerce.date(),
});

type UpdateSupportTicketBodySchema = z.infer<
  typeof updateSupportTicketBodySchema
>;

@Controller("/update/support")
@UseGuards(JwtAuthGuard)
export class UpdateSupportTicketController {
  constructor(private prisma: PrismaService) {}
  @Put("/ticket")
  async handle(
    @Body(new ZodValidationPipe(updateSupportTicketBodySchema))
    body: UpdateSupportTicketBodySchema,
  ) {
    const { collaboratorId, endDate, helper, id, priority, projectId, status } =
      body;

    await this.prisma.support.update({
      where: {
        id,
      },
      data: {
        collaboratorId,
        endDate,
        priority,
        projectId,
        helperTopic: helper,
        status,
      },
    });

    return 201;
  }
}
