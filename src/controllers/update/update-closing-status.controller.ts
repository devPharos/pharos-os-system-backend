import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const updateClosingSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["Aberto", "Pago", "Cancelado"]),
});

type UpdateClosingSchema = z.infer<typeof updateClosingSchema>;

@Controller("/update")
@UseGuards(JwtAuthGuard)
export class UpdateClosingStatusController {
  constructor(private prisma: PrismaService) {}
  @Put("/closing/status")
  @HttpCode(201)
  async handle(@Body() body: UpdateClosingSchema) {
    const { id, status } = body;

    await this.prisma.closing.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    const closings = await this.prisma.closing.findMany({
      include: {
        project: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            fantasyName: true,
          },
        },
      },
    });

    return closings;
  }
}
