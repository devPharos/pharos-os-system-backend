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
export class GetProjectExpensesController {
  constructor(private prisma: PrismaService) {}
  @Get("/project-expenses")
  @HttpCode(201)
  async handle(@Headers() header: GetProjectsBodySchema) {
    const { projectid } = header;
    const projectExpenses = await this.prisma.projectExpenses.findMany({
      where: {
        projectId: projectid,
      },
    });

    return {
      projectExpenses,
    };
  }
}
