import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { differenceInHours, parse, parseISO } from "date-fns";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

// const serviceOrderProjectExpensesFile = z.object({
//   fileId: z.string(),
//   fileUrl: z.string().url(),
//   fileName: z.string(),
//   fileSize: z.string(),
// });

export const serviceOrderExpenses = z.object({
  projectExpenseId: z.string().uuid(),
  value: z.string(),
});

export type ServiceOrderExpenses = z.infer<typeof serviceOrderExpenses>;

export const serviceOrderDetails = z.object({
  description: z.string(),
  endDate: z.string(),
  startDate: z.string(),
  projectServiceId: z.string().uuid(),
  projectId: z.string().uuid(),
  expenses: z.array(serviceOrderExpenses),
});

export type ServiceOrderDetailsSchema = z.infer<typeof serviceOrderDetails>;

export interface ServiceOrderDetails extends ServiceOrderDetailsSchema {
  project: {
    name: string;
    service: {
      description: string;
    };
  };
}

const createServiceOrderBodySchema = z.object({
  clientId: z.string().uuid(),
  date: z.string(),
  serviceType: z.enum(["Presencial", "Remoto"]),
  status: z.enum(["Aberto", "Rascunho"]),
  details: z.array(serviceOrderDetails),
});

type CreateServiceOrderBodySchema = z.infer<
  typeof createServiceOrderBodySchema
>;

@Controller("/service-order")
@UseGuards(JwtAuthGuard)
export class CreateServiceOrderController {
  constructor(private prisma: PrismaService) {}
  @Post()
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createServiceOrderBodySchema))
    body: CreateServiceOrderBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { date, details, clientId, serviceType, status } = body;

    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: user.sub,
      },
    });

    const startDate = details.sort((a, b) => {
      return (
        parse(a.startDate, "HH:mm", parseISO(date)).getTime() -
        parse(b.startDate, "HH:mm", parseISO(date)).getTime()
      );
    })[0].startDate;

    const endDate = details.sort((a, b) => {
      return (
        parse(b.endDate, "HH:mm", parseISO(date)).getTime() -
        parse(a.endDate, "HH:mm", parseISO(date)).getTime()
      );
    })[0].endDate;

    const totalHours = differenceInHours(
      parse(endDate, "HH:mm", parseISO(date)),
      parse(startDate, "HH:mm", parseISO(date)),
    ).toString();

    const serviceOrderWithSameHour = await this.prisma.serviceOrder.findMany({
      where: {
        AND: {
          collaboratorId: collaborator?.id,
          OR: [
            {
              startDate: {
                lte: parse(startDate, "HH:mm", parseISO(date)),
              },
              endDate: {
                gte: parse(startDate, "HH:mm", parseISO(date)),
              },
            },
            {
              startDate: {
                lte: parse(endDate, "HH:mm", parseISO(date)),
              },
              endDate: {
                gte: parse(endDate, "HH:mm", parseISO(date)),
              },
            },
          ],
        },
      },
    });

    if (serviceOrderWithSameHour.length !== 0) {
      throw new ConflictException("Ja existe uma OS nesse horário");
    }
    const newEndDate = parse(endDate, "HH:mm", parseISO(date));
    const newStartDate = parse(startDate, "HH:mm", parseISO(date));

    const serviceOrder = await this.prisma.serviceOrder.create({
      data: {
        endDate: newEndDate,
        startDate: newStartDate,
        status,
        totalHours,
        clientId,
        collaboratorId: collaborator?.id || "",
        companyId: collaborator?.companyId || "",
        date: parseISO(date),
        remote: serviceType !== "Presencial",
      },
    });

    details.map(async (detail) => {
      await this.prisma.serviceOrderDetails.create({
        data: {
          description: detail.description,
          endDate: parse(detail.endDate, "HH:mm", parseISO(date)),
          startDate: parse(detail.startDate, "HH:mm", parseISO(date)),
          projectId: detail.projectId,
          companyId: collaborator?.companyId || "",
          serviceOrderId: serviceOrder.id,
          projectServiceId: detail.projectServiceId,
        },
      });

      detail.expenses.map(async (expense) => {
        await this.prisma.serviceOrderExpenses.create({
          data: {
            value: expense.value,
            companyId: collaborator?.companyId || "",
            serviceOrderId: serviceOrder.id,
            projectExpenseId: expense.projectExpenseId,
            projectId: detail.projectId,
          },
        });
      });
    });

    // detail.project.projectsExpenses.map(async (expense) => {
    //   let fileId = "";

    //   if (expense.serviceOrderProjectExpensesFile) {
    //     const file = await this.prisma.file.create({
    //       data: {
    //         fileId: expense.serviceOrderProjectExpensesFile?.fileId,
    //         name: expense.serviceOrderProjectExpensesFile.fileName,
    //         size: expense.serviceOrderProjectExpensesFile.fileSize,
    //         url: expense.serviceOrderProjectExpensesFile.fileUrl,
    //         companyId: collaborator?.companyId || "",
    //       },
    //     });

    //     fileId = file.id;
    //   }

    //   await this.prisma.serviceOrderExpenses.create({
    //     data: {
    //       value: expense.value,
    //       projectExpenseId: expense.id,
    //       serviceOrderId: serviceOrder.id,
    //       projectId: detail.project.id,
    //       companyId: collaborator?.companyId || "",
    //       fileId: fileId !== "" ? fileId : null,
    //     },
    //   });
    // });
    // });

    return "created";
  }
}
