import { Controller, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/sessions")
@UseGuards(JwtAuthGuard)
export class LogOutUserController {
  constructor(private prisma: PrismaService) {}
  @Post("/logout")
  @HttpCode(201)
  async handle(@Req() req: Request) {
    const token = req.headers;
  }
}
