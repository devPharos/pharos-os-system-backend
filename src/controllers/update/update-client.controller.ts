import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const updateClientBodySchema = z.object({
  userId: z.string().uuid(),
  cnpj: z.string(),
});

type UpdateClientBodySchema = z.infer<typeof updateClientBodySchema>;

@Controller("/accounts")
@UseGuards(JwtAuthGuard)
export class UpdateClientController {
  constructor(private prisma: PrismaService) {}
  @Put("/client")
  @HttpCode(201)
  async handle(@Body() body: UpdateClientBodySchema) {
    const { userId, cnpj } = body;

    await this.prisma.client.update({
      where: { cnpj },
      data: {
        user: {
          connect: { id: userId },
        },
      },
    });
  }
}
