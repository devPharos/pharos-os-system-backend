import {
  Controller,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const findUserSchema = z.object({
  id: z.string().uuid(),
});

type FindUserSchema = z.infer<typeof findUserSchema>;

@Controller("/find")
@UseGuards(JwtAuthGuard)
export class FindUserController {
  constructor(private prisma: PrismaService) {}
  @Get("/user")
  @HttpCode(201)
  async handle(
    @Headers() header: FindUserSchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { id } = header;

    const userFounded = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        collaborator: {
          select: {
            id: true,
            name: true,
            lastName: true,
          },
        },
        email: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return {
      ...userFounded,
      name: userFounded?.collaborator?.name,
      lastName: userFounded?.collaborator?.lastName,
      collaboratorId: userFounded?.collaborator?.id,
    };
  }
}
