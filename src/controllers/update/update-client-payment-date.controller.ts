import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import {
  add,
  isFriday,
  isMonday,
  isSaturday,
  isSunday,
  isThursday,
  isTuesday,
  isWednesday,
  nextFriday,
  nextMonday,
  nextSaturday,
  nextSunday,
  nextThursday,
  nextTuesday,
  nextWednesday,
} from "date-fns";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const updateClientPaymentDateSchema = z.object({
  projectId: z.string().uuid(),
});

type UpdateClientPaymentDateSchema = z.infer<
  typeof updateClientPaymentDateSchema
>;

@Controller("/update")
@UseGuards(JwtAuthGuard)
export class UpdateClientPaymentDateStatusController {
  constructor(private prisma: PrismaService) {}
  @Put("/client/payment-date")
  @HttpCode(201)
  async handle(@Body() body: UpdateClientPaymentDateSchema) {
    const { projectId } = body;

    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    const client = await this.prisma.client.findUnique({
      where: {
        id: project?.clientId,
      },
    });

    if (client) {
      console.log(client);
      if (client.daysAfterClosing && client.daysAfterClosing !== "") {
        const daysAfterClosing = parseInt(client.daysAfterClosing);
        const newDate = new Date();
        let dateToClosing = add(newDate, {
          days: daysAfterClosing,
        });

        if (client.paymentWeekDate && client.paymentWeekDate !== "") {
          if (client.paymentWeekDate === "segunda") {
            const mondayDate = isMonday(dateToClosing)
              ? dateToClosing
              : nextMonday(dateToClosing);
            dateToClosing = mondayDate;
          }

          if (client.paymentWeekDate === "terca") {
            const tuesdayDate = isTuesday(dateToClosing)
              ? dateToClosing
              : nextTuesday(dateToClosing);
            dateToClosing = tuesdayDate;
          }

          if (client.paymentWeekDate === "quarta") {
            const wednesdayDate = isWednesday(dateToClosing)
              ? dateToClosing
              : nextWednesday(dateToClosing);
            dateToClosing = wednesdayDate;
          }

          if (client.paymentWeekDate === "quinta") {
            const thursdayDate = isThursday(dateToClosing)
              ? dateToClosing
              : nextThursday(dateToClosing);
            dateToClosing = thursdayDate;
          }

          if (client.paymentWeekDate === "sexta") {
            const fridayDate = isFriday(dateToClosing)
              ? dateToClosing
              : nextFriday(dateToClosing);
            dateToClosing = fridayDate;
          }

          if (client.paymentWeekDate === "sabado") {
            const saturdayDate = isSaturday(dateToClosing)
              ? dateToClosing
              : nextSaturday(dateToClosing);
            dateToClosing = saturdayDate;
          }

          if (client.paymentWeekDate === "domingo") {
            const sundayDate = isSunday(dateToClosing)
              ? dateToClosing
              : nextSunday(dateToClosing);
            dateToClosing = sundayDate;
          }
        }

        console.log(client.daysAfterClosing);

        // const newPaymentDate = dateToClosing.getDate();

        // await this.prisma.client.update({
        //   data: {
        //     paymentDate: newPaymentDate.toString(),
        //   },
        //   where: {
        //     id: client.id,
        //   },
        // });
      }
    }
  }
}
