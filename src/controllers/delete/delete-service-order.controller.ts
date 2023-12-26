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

const deleteServiceOrderHeaderSchema = z.object({
  id: z.string().uuid(),
});

type DeleteServiceOrderHeaderSchema = z.infer<
  typeof deleteServiceOrderHeaderSchema
>;

@Controller("/delete")
@UseGuards(JwtAuthGuard)
export class DeleteServiceOrderController {
  constructor(private prisma: PrismaService) {}
  @Delete("/service-order")
  @HttpCode(201)
  async handle(@Headers() header: DeleteServiceOrderHeaderSchema) {
    const { id } = header;

    await this.prisma.serviceOrderDetails.deleteMany({
      where: {
        serviceOrderId: id,
      },
    });

    await this.prisma.serviceOrderExpenses.deleteMany({
      where: {
        serviceOrderId: id,
      },
    });

    await this.prisma.serviceOrder.delete({
      where: { id },
    });
  }
}
