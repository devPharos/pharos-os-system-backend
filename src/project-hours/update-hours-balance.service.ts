import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { getDate, getMonth, getYear, isToday } from "date-fns";

@Injectable()
export class ProjectUsedHoursService {
  constructor(private prisma: PrismaService) {}

  async scheduleUpdateProjectUsedHoursSending() {
    const month = getMonth(new Date());
    const year = getYear(new Date());
    const isFirstDayOfTheMonth = isToday(new Date(year, month, 1));

    if (isFirstDayOfTheMonth) {
      const projects = await this.prisma.project.findMany();

      projects.forEach(async (project) => {
        await this.checkProjectUsedHours(project.id);
      });
    }
  }

  async checkProjectUsedHours(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (project) {
      const month = getMonth(new Date());
      const year = getYear(new Date());
      const today = getDate(new Date());
      const lastDayOfPastMonth = new Date(year, month - 1, today - 1);
      const firstDayOfLastMonth = new Date(year, month - 1, 1);

      const serviceOrders = await this.prisma.serviceOrder.findMany({
        where: {
          AND: [
            {
              startDate: {
                gte: firstDayOfLastMonth,
              },
            },
            {
              endDate: {
                lte: lastDayOfPastMonth,
              },
            },
            {
              serviceOrderDetails: {
                every: {
                  projectId,
                },
              },
            },
          ],
        },
      });

      let projectUsedHours = 0;

      serviceOrders.forEach((os) => {
        projectUsedHours += parseInt(os.totalHours);
      });

      const hoursBalance = (
        (project.hoursBalance ? parseInt(project.hoursBalance) : 0) +
        projectUsedHours
      ).toString();

      await this.prisma.project.update({
        where: {
          id: projectId,
        },
        data: {
          hoursBalance,
        },
      });
    }
  }
}
