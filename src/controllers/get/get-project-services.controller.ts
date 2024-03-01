import { Controller, Get, Headers, HttpCode, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const getProjectsBodySchema = z.object({
  projectid: z.string().uuid(),
});

type GetProjectsBodySchema = z.infer<typeof getProjectsBodySchema>;

@Controller()
@UseGuards(JwtAuthGuard)
export class GetProjectServicesController {
  constructor(private prisma: PrismaService) {}
  @Get("/project-services")
  @HttpCode(201)
  async handle(@Headers() headers: GetProjectsBodySchema) {
    const { projectid } = headers;
    const projectsServices = await this.prisma.projectService.findMany({
      where: {
        projectId: projectid,
      },
    });

    return {
      projectsServices,
    };
  }
}
