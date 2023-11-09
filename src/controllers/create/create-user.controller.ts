import {
  Body,
  ConflictException,
  Controller,
  Post,
  UseGuards,
} from "@nestjs/common";
import { hash } from "bcryptjs";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const createUserBodySchema = z.object({
  collaboratorId: z.string().uuid(),
  email: z.string().email(),
  password: z.string(),
});

type CreateUserBodySchema = z.infer<typeof createUserBodySchema>;

@Controller("/accounts")
@UseGuards(JwtAuthGuard)
export class CreateUserController {
  constructor(private prisma: PrismaService) {}

  @Post("/user")
  async handle(
    @Body(new ZodValidationPipe(createUserBodySchema))
    body: CreateUserBodySchema,
  ) {
    const { email, password, collaboratorId } = body;

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

    const currentCollaborator = await this.prisma.collaborator.findUnique({
      where: { id: collaboratorId },
    });

    const currentCompany = await this.prisma.company.findUnique({
      where: {
        id: currentCollaborator?.companyId,
      },
    });

    const newUser = await this.prisma.user.upsert({
      create: {
        company: {
          connect: { cnpj: currentCompany?.cnpj },
        },
        email,
        password: hashedPassword,
        group: {
          connect: { id: 3 },
        },
      },
      update: {
        company: {
          connect: { cnpj: currentCompany?.cnpj },
        },
        email,
        password: hashedPassword,
        group: {
          connect: { id: 3 },
        },
      },
      where: {
        email,
      },
    });

    await this.prisma.collaborator.update({
      where: {
        id: collaboratorId,
      },
      data: {
        userId: newUser.id,
      },
    });
  }
}
