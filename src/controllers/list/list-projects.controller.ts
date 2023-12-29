import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/list")
@UseGuards(JwtAuthGuard)
export class ListProjectsController {
  constructor(private prisma: PrismaService) {}
  @Get("/projects")
  @HttpCode(201)
  async handle(@CurrentUser() user: UserPayload) {
    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
      },
    });

    const client = await this.prisma.client.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
      },
    });

    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          {
            clientId: client?.id,
            coordinatorId: collaborator?.id,
          },
        ],
      },
    });

    return projects;
  }
}
