import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { format } from "date-fns";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/list")
@UseGuards(JwtAuthGuard)
export class ListServiceOrdersFiltersController {
  constructor(private prisma: PrismaService) {}
  @Get("/service-orders/filters")
  @HttpCode(201)
  async handle(@CurrentUser() user: UserPayload) {
    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
      },
    });

    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where: {
        collaboratorId: collaborator?.id,
      },
      select: {
        startDate: true,
        endDate: true,
      },
    });

    const serviceOrdersSupervisedByMe = await this.prisma.serviceOrder.findMany(
      {
        where: {
          collaborator: {
            supervisorId: collaborator?.id,
          },
        },
        select: {
          startDate: true,
          endDate: true,
        },
      },
    );

    const dates: {
      formattedDate: string;
      date: string;
    }[] = [];

    serviceOrders.forEach((os: any) => {
      const formattedDate = format(os.startDate, "MMMM - yyyy");
      const dateAlreadyExists = dates.find(
        (date) => date.formattedDate === formattedDate,
      );

      if (!dateAlreadyExists) {
        dates.push({
          formattedDate,
          date: os.startDate.toISOString(),
        });
      }
    });

    serviceOrdersSupervisedByMe.forEach((os: any) => {
      const formattedDate = format(os.startDate, "MMMM - yyyy");
      const dateAlreadyExists = dates.find(
        (date) => date.formattedDate === formattedDate,
      );

      if (!dateAlreadyExists) {
        dates.push({
          formattedDate,
          date: os.startDate.toISOString(),
        });
      }
    });

    return dates.sort((a, b) => {
      const dataA = new Date(a.formattedDate).getTime();
      const dataB = new Date(b.formattedDate).getTime();

      return dataA - dataB;
    });
  }
}
