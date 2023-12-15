import {
  Controller,
  Delete,
  Headers,
  HttpCode,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const deleteExpenseHeaderSchema = z.object({
  expenseid: z.string().uuid(),
  projectid: z.string().uuid(),
});

type DeleteExpenseHeaderSchema = z.infer<typeof deleteExpenseHeaderSchema>;

@Controller("/delete")
@UseGuards(JwtAuthGuard)
export class DeleteExpenseController {
  constructor(private prisma: PrismaService) {}
  @Delete("/project/expense")
  @HttpCode(201)
  async handle(@Headers() header: DeleteExpenseHeaderSchema) {
    const { expenseid, projectid } = header;

    await this.prisma.projectExpenses.delete({
      where: { id: expenseid },
    });

    const expenses = await this.prisma.projectExpenses.findMany({
      where: {
        projectId: projectid,
      },
    });

    return expenses;
  }
}
