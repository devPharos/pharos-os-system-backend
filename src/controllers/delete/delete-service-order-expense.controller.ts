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
  serviceorderexpenseid: z.string().uuid(),
  serviceorderid: z.string().uuid(),
});

type DeleteExpenseHeaderSchema = z.infer<typeof deleteExpenseHeaderSchema>;

@Controller("/delete")
@UseGuards(JwtAuthGuard)
export class DeleteOSExpenseController {
  constructor(private prisma: PrismaService) {}
  @Delete("/service-order/expense")
  @HttpCode(201)
  async handle(@Headers() header: DeleteExpenseHeaderSchema) {
    const { serviceorderexpenseid, serviceorderid } = header;

    await this.prisma.serviceOrderExpenses.delete({
      where: {
        id: serviceorderexpenseid,
      },
    });
    const expenses = this.prisma.serviceOrderExpenses.findMany({
      where: {
        serviceOrderId: serviceorderid,
      },
    });

    return expenses;
  }
}
