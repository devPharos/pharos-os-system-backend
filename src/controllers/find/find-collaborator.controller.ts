import {
  Controller,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const findCollaboratorSchema = z.object({
  id: z.string().uuid(),
});

type FindCollaboratorSchema = z.infer<typeof findCollaboratorSchema>;

@Controller("/find")
@UseGuards(JwtAuthGuard)
export class FindCollaboratorController {
  constructor(private prisma: PrismaService) {}
  @Get("/collaborator")
  @HttpCode(201)
  async handle(@Headers() header: FindCollaboratorSchema) {
    const { id } = header;

    const collaboratorFounded = await this.prisma.collaborator.findUnique({
      where: {
        id,
      },
      include: {
        supervisor: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!collaboratorFounded) {
      throw new NotFoundException("Collaborator not found.");
    }

    return {
      ...collaboratorFounded,
      id: collaboratorFounded?.supervisor?.id,
    };
  }
}
