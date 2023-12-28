import { Controller, Get, Headers, HttpCode, UseGuards } from "@nestjs/common";
import { format, getMonth, getYear, parseISO } from "date-fns";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const listOsSchema = z.object({
  filterdate: z.string().optional(),
});

type ListOsSchema = z.infer<typeof listOsSchema>;

@Controller("/list")
@UseGuards(JwtAuthGuard)
export class ListServiceOrdersController {
  constructor(private prisma: PrismaService) {}
  @Get("/service-orders")
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
    @Headers() header: ListOsSchema,
  ) {
    const { filterdate } = header;

    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: user.sub,
      },
      select: {
        id: true,
      },
    });

    const serviceOrdersDates = await this.prisma.serviceOrder.findMany({
      where: {
        collaboratorId: collaborator?.id,
      },
      select: {
        startDate: true,
      },
    });

    const serviceOrdersSupervisedByMeDates =
      await this.prisma.serviceOrder.findMany({
        where: {
          collaborator: {
            supervisorId: collaborator?.id,
          },
        },
        select: {
          startDate: true,
        },
      });

    const dates: {
      formattedDate: string;
      date: string;
    }[] = [];

    serviceOrdersDates.forEach((os) => {
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

    serviceOrdersSupervisedByMeDates.forEach((os) => {
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

    const actualMonth = getMonth(new Date());
    const actualYear = getYear(new Date());
    const hasOsThisMonth = dates.find(
      (date) =>
        getMonth(parseISO(date.date)) === actualMonth &&
        getYear(parseISO(date.date)) === actualYear,
    );

    const defaultDate = hasOsThisMonth || dates[0];
    const date = filterdate || defaultDate.date;

    const month = getMonth(new Date(date)) + 1;

    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where: {
        collaboratorId: collaborator?.id,
        AND: {
          startDate: {
            gte: new Date(2023, month - 1, 1),
            lt: new Date(2023, month, 1),
          },
          endDate: {
            gte: new Date(2023, month - 1, 1),
            lt: new Date(2023, month, 1),
          },
        },
      },
      select: {
        id: true,
        clientId: true,
        status: true,
        startDate: true,
        endDate: true,
        date: true,
        collaborator: {
          select: {
            name: true,
            lastName: true,
            supervisorId: true,
            id: true,
          },
        },
        client: {
          select: {
            fantasyName: true,
            cnpj: true,
          },
        },
      },
    });

    const serviceOrdersSupervisedByMe = await this.prisma.serviceOrder.findMany(
      {
        where: {
          collaborator: {
            supervisorId: collaborator?.id,
          },
          AND: {
            startDate: {
              gte: new Date(2023, month - 1, 1),
              lt: new Date(2023, month, 1),
            },
            endDate: {
              gte: new Date(2023, month - 1, 1),
              lt: new Date(2023, month, 1),
            },
            status: {
              not: "Rascunho",
            },
          },
        },
        select: {
          id: true,
          client: {
            select: {
              fantasyName: true,
              cnpj: true,
            },
          },
          status: true,
          startDate: true,
          endDate: true,
          date: true,
          collaborator: {
            select: {
              name: true,
              lastName: true,
              supervisorId: true,
              id: true,
            },
          },
        },
      },
    );

    return {
      serviceOrders,
      serviceOrdersSupervisedByMe,
      defaultDate,
      date: defaultDate.date,
      formattedDate: defaultDate.formattedDate,
    };
  }
}
