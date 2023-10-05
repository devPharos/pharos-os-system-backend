import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const serviceOrderExpensesSchema = z.object({
  projectExpenseId: z.string().uuid(),
  value: z.string(),
});

const projectDetailsSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  projectId: z.string().uuid(),
  projectServiceId: z.string().uuid(),
  description: z.string(),
});

const serviceOrderDetails = z.object({
  projectDetails: projectDetailsSchema,
  projectExpenses: z.array(serviceOrderExpensesSchema),
});

const createServiceOrderBodySchema = z.object({
  clientId: z.string().uuid(),
  collaboratorId: z.string().uuid(),
  companyId: z.string().uuid(),
  date: z.coerce.date(),
  remote: z.boolean(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  totalHours: z.string(),
  serviceOrderDetails: z.array(serviceOrderDetails),
});

// create service order
/* 
companyId: z.string().uuid(),
collaboratorId: z.string().uuid(),
clientId: z.string().uuid(),
remote: z.boolean(),
date: z.coerce.date(),
startDate: z.coerce.date(),
endDate: z.coerce.date()
totalHours: z.string(),
*/

// create service order details
/* 
companyId: z.string().uuid(),
serviceOrderId: z.string().uuid(),
projectId: z.string().uuid(),
projectServiceId: z.string().uuid(),
description: z.string().min(1),
startDate: z.coerce.date(),
endDate: z.coerce.date()
*/

// create service order expenses
/* 
companyId: z.string().uuid(),
serviceOrderId: z.string().uuid(),
projectId: z.string().uuid(),
projectExpenseId: z.string().uuid(),
fileId: z.string().uuid(),
value: z.string(),
*/

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
  ) {
    const {
      clientId,
      collaboratorId,
      companyId,
      date,
      remote,
      serviceOrderDetails,
      startDate,
      endDate,
      totalHours,
    } = body;

    const serviceOrder = await this.prisma.serviceOrder.create({
      data: {
        startDate,
        endDate,
        date,
        totalHours,
        clientId,
        companyId,
        collaboratorId,
        remote,
        status: "Aberto",
      },
    });

    serviceOrderDetails.forEach(async (detail) => {
      await this.prisma.serviceOrderDetails.create({
        data: {
          description: detail.projectDetails.description,
          startDate: detail.projectDetails.startDate,
          endDate: detail.projectDetails.endDate,
          companyId,
          projectId: detail.projectDetails.projectId,
          projectServiceId: detail.projectDetails.projectServiceId,
          serviceOrderId: serviceOrder.id,
        },
      });

      detail.projectExpenses.forEach(async (expense) => {
        await this.prisma.serviceOrderExpenses.create({
          data: {
            value: expense.value,
            companyId,
            serviceOrderId: serviceOrder.id,
            projectId: detail.projectDetails.projectId,
            projectExpenseId: expense.projectExpenseId,
          },
        });
      });
    });

    return "created";
  }
}
