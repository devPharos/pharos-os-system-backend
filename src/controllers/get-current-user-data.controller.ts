import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/user")
@UseGuards(JwtAuthGuard)
export class GetUserDataController {
  constructor(private prisma: PrismaService) {}

  @Get("/data")
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

    const client = await this.prisma.client.findUnique({
      where: {
        userId: currentUser?.id,
      },
    });

    let file;

    if (collaborator?.fileId) {
      file = await this.prisma.file.findUnique({
        where: {
          id: collaborator?.fileId || undefined,
        },
      });
    }

    return {
      userId: currentUser?.id,
      companyId: currentUser?.companyId,
      collaboratorId: collaborator?.id,
      clientId: client?.id,
      name: collaborator?.name,
      fantasyName: client?.fantasyName,
      groupId: currentUser?.groupId,
      url:
        file &&
        file?.url +
          "/file/pharosit-miscelaneous/" +
          file?.name.replace(/ /g, "%20"),
    };
  }
}
