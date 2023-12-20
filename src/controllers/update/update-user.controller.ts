import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Put,
  UseGuards,
} from "@nestjs/common";
import { hash } from "bcryptjs";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const updateUserBodySchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  password: z.string(),
});

type UpdateUserBodySchema = z.infer<typeof updateUserBodySchema>;

@Controller("/update")
@UseGuards(JwtAuthGuard)
export class UpdateUserController {
  constructor(private prisma: PrismaService) {}
  @Put("/user")
  @HttpCode(201)
  async handle(@Body() body: UpdateUserBodySchema) {
    const { email, password, userId } = body;

    const userWithSameEmail = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (userWithSameEmail) {
      throw new ConflictException(
        "User with same email address already exists",
      );
    }

    const hashedPassword = await hash(password, 8);

    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        email,
        password: hashedPassword,
      },
    });

    return user;
  }
}
