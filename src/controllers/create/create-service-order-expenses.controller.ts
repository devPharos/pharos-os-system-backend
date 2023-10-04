import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const createServiceOrderExpensesBodySchema = z.object({
  companyId: z.string().uuid(),
  serviceOrderId: z.string().uuid(),
  projectId: z.string().uuid(),
  projectExpenseId: z.string().uuid(),
  fileId: z.string().uuid(),
  value: z.string(),
});

type CreateServiceOrderExpensesBodySchema = z.infer<
  typeof createServiceOrderExpensesBodySchema
>;

@Controller("/service-orders")
@UseGuards(JwtAuthGuard)
export class CreateServiceOrderExpensesController {
  constructor(private prisma: PrismaService) {}
  @Post("/expenses")
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createServiceOrderExpensesBodySchema))
    body: CreateServiceOrderExpensesBodySchema,
  ) {
    const {
      companyId,
      fileId,
      projectExpenseId,
      projectId,
      serviceOrderId,
      value,
    } = body;

    await this.prisma.serviceOrderExpenses.create({
      data: {
        value,
        file: {
          connect: { id: fileId },
        },
        company: {
          connect: { id: companyId },
        },
        project: {
          connect: { id: projectId },
        },
        serviceOrder: {
          connect: { id: serviceOrderId },
        },
        projectExpenses: {
          connect: { id: projectExpenseId },
        },
      },
    });
  }
}
