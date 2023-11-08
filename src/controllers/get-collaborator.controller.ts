import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";

import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/profile")
@UseGuards(JwtAuthGuard)
export class GetCollaboratorProfileController {
  constructor(private prisma: PrismaService) {}
  @Get()
  @HttpCode(201)
  async handle(@CurrentUser() user: UserPayload) {
    const collaborator = await this.prisma.collaborator.findUnique({
      where: { userId: user.sub },
    });

    return {
      firstName: collaborator?.name,
      lastName: collaborator?.lastName,
      phone: collaborator?.phone,
      address: collaborator?.address,
      number: collaborator?.number,
      cep: collaborator?.cep,
      complement: collaborator?.complement,
    };
  }
}
