import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const updateClientSchema = z.object({
  clientId: z.string().uuid(),
  active: z.boolean(),
});

type UpdateClientSchema = z.infer<typeof updateClientSchema>;

@Controller("/update")
@UseGuards(JwtAuthGuard)
export class UpdateClientStatusController {
  constructor(private prisma: PrismaService) {}
  @Put("/client/status")
  @HttpCode(201)
  async handle(
    @Body() body: UpdateClientSchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { clientId, active } = body;

    await this.prisma.client.update({
      where: {
        id: clientId,
      },
      data: {
        active,
      },
    });

    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
      },
    });

    const clients = this.prisma.client.findMany({
      where: {
        companyId: currentUser?.companyId,
      },
    });

    return clients;
  }
}
