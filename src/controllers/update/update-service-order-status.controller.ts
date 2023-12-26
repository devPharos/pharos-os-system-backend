import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const updateServiceOrderStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["Aberto", "Enviado", "Faturado", "Validado", "Rascunho"]),
});

type UpdateServiceOrderSchema = z.infer<typeof updateServiceOrderStatusSchema>;

@Controller("/update")
@UseGuards(JwtAuthGuard)
export class UpdateServiceOrderController {
  constructor(private prisma: PrismaService) {}
  @Put("/service-order/status")
  @HttpCode(201)
  async handle(@Body() body: UpdateServiceOrderSchema) {
    const { id, status } = body;

    const serviceOrder = await this.prisma.serviceOrder.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    return serviceOrder;
  }
}
