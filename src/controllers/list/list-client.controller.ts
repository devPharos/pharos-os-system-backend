import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("")
@UseGuards(JwtAuthGuard)
export class ListClientsController {
  constructor(private prisma: PrismaService) {}

  @Get("/clients")
  @HttpCode(201)
  async handle(@CurrentUser() user: UserPayload) {
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
