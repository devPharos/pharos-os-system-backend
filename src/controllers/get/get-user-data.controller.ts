import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/accounts")
@UseGuards(JwtAuthGuard)
export class GetCurrentUserDataController {
  constructor(private prisma: PrismaService) {}
  @Get("/user")
  @HttpCode(201)
  async handle(@CurrentUser() user: UserPayload) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
    });

    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: currentUser?.id,
      },
    });

    return {
      userId: currentUser?.id,
      companyId: currentUser?.companyId,
      collaboratorId: collaborator?.id,
    };
  }
}
