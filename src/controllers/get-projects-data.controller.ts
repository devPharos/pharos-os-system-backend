import { Body, Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const getProjectsBodySchema = z.object({
  clientId: z.string().uuid(),
});

type GetProjectsBodySchema = z.infer<typeof getProjectsBodySchema>;

@Controller()
@UseGuards(JwtAuthGuard)
export class GetProjectsDataController {
  constructor(private prisma: PrismaService) {}
  @Get("/projects")
  @HttpCode(201)
  async handle(@Body() body: GetProjectsBodySchema) {
    const { clientId } = body;
    const projects = await this.prisma.project.findMany({
      where: {
        clientId,
      },
    });

    return {
      projects,
    };
  }
}
