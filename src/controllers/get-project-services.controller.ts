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
export class GetProjectServicesController {
  constructor(private prisma: PrismaService) {}
  @Get("/project-services")
  @HttpCode(201)
  async handle(@Body() body: GetProjectsBodySchema) {
    const { projectId } = body;
    const projectsServices = await this.prisma.projectService.findMany({
      where: {
        projectId,
      },
    });

    return {
      projectsServices,
    };
  }
}
