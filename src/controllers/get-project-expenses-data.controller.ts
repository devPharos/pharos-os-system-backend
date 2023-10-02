import { Body, Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const getProjectsBodySchema = z.object({
  projectId: z.string().uuid(),
});

type GetProjectsBodySchema = z.infer<typeof getProjectsBodySchema>;

@Controller()
@UseGuards(JwtAuthGuard)
export class GetProjectsServiceDataController {
  constructor(private prisma: PrismaService) {}
  @Get("/projects-services")
  @HttpCode(201)
  async handle(@Body() body: GetProjectsBodySchema) {
    const { projectId } = body;
    const projects = await this.prisma.projectService.findMany({
      where: {
        projectId,
      },
    });

    return {
      projects,
    };
  }
}
