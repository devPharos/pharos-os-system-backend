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
export class GetProjectExpensesController {
  constructor(private prisma: PrismaService) {}
  @Get("/project-expenses")
  @HttpCode(201)
  async handle(@Body() body: GetProjectsBodySchema) {
    const { projectId } = body;
    const projectExpenses = await this.prisma.projectExpenses.findMany({
      where: {
        projectId,
      },
    });

    return {
      projectExpenses,
    };
  }
}
