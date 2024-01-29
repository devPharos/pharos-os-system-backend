import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("list")
@UseGuards(JwtAuthGuard)
export class ListClosingController {
  constructor(private prisma: PrismaService) {}

  @Get("closing")
  @HttpCode(201)
  async handle() {
    const closing = await this.prisma.closing.findMany({
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

    return closing;
  }
}
