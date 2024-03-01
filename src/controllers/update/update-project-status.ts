import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const updateProjectSchema = z.object({
  projectId: z.string().uuid(),
  status: z.enum(["NaoIniciado", "Iniciado", "Finalizado", "Cancelado"]),
});

type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;

@Controller("/update")
@UseGuards(JwtAuthGuard)
export class UpdateProjectStatusController {
  constructor(private prisma: PrismaService) {}
  @Put("/project/status")
  @HttpCode(201)
  async handle(
    @Body() body: UpdateProjectSchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { projectId, status } = body;

    await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        status,
      },
    });

    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
      },
    });

    const projects = this.prisma.project.findMany({
      where: {
        companyId: currentUser?.companyId,
      },
    });

    return projects;
  }
}
