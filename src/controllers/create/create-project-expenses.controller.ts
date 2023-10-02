import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const createProjectExpensesBodySchema = z.object({
  companyId: z.string().uuid(),
  projectId: z.string().uuid(),
  description: z.string(),
  value: z.string(),
  requireReceipt: z.boolean(),
});

type CreateProjectExpensesBodySchema = z.infer<
  typeof createProjectExpensesBodySchema
>;

@Controller("/projects")
@UseGuards(JwtAuthGuard)
export class CreateProjectExpensesController {
  constructor(private prisma: PrismaService) {}
  @Post("/expenses")
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createProjectExpensesBodySchema))
    body: CreateProjectExpensesBodySchema,
  ) {
    const { companyId, description, projectId, requireReceipt, value } = body;

    await this.prisma.projectExpenses.create({
      data: {
        description,
        requireReceipt,
        value,
        project: {
          connect: { id: projectId },
        },
        company: {
          connect: { id: companyId },
        },
      },
    });
  }
}
