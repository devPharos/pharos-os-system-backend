import { Body, Controller, Post, HttpCode, UseGuards } from "@nestjs/common";

import {
  ProjectDetails,
  ServiceOrderExpenses,
} from "src/@types/service-orders";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const getServiceOrderSchema = z.object({
  serviceOrderId: z.string().uuid(),
});

type GetServiceOrderBodySchema = z.infer<typeof getServiceOrderSchema>;

@Controller("/service-order")
@UseGuards(JwtAuthGuard)
export class GetServiceOrderDataController {
  constructor(private prisma: PrismaService) {}
  @Post("/data")
  @HttpCode(201)
  async handle(@Body() body: GetServiceOrderBodySchema) {
    const { serviceOrderId } = body;

    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: {
        id: serviceOrderId,
      },
    });

    const serviceOrderDetails = await this.prisma.serviceOrderDetails.findMany({
      where: {
        serviceOrderId,
      },
    });

    const serviceOrderExpenses =
      await this.prisma.serviceOrderExpenses.findMany({
        where: {
          serviceOrderId,
        },
      });

    const projectExpense = await this.prisma.projectExpenses.findMany();

    const client = await this.prisma.client.findUnique({
      where: { id: serviceOrder?.clientId },
    });

    const collaborator = await this.prisma.collaborator.findUnique({
      where: { id: serviceOrder?.collaboratorId },
    });

    const projectServices = await this.prisma.projectService.findMany();
    const projects = await this.prisma.project.findMany();

    const osDetails: ProjectDetails[] = [];

    serviceOrderDetails.forEach((detail) => {
      const projectExpenses = serviceOrderExpenses.filter(
        (expense) => expense.projectId === detail.projectId,
      );

      const newExpenses: ServiceOrderExpenses[] = [];

      projectExpenses.forEach((expense) => {
        const expenseType = projectExpense.find(
          (pe) => expense.projectExpenseId === pe.id,
        );

        const newExpense: ServiceOrderExpenses = {
          ...expense,
          description: expenseType?.description || "",
        };

        newExpenses.push(newExpense);
      });

      const projectService = projectServices.find(
        (service) => service.id === detail.projectServiceId,
      );

      const project = projects.find(
        (project) => project.id === detail.projectId,
      );

      const newOs = {
        projectDetails: {
          ...detail,
          projectServiceType: projectService?.description,
          projectName: project?.name,
        },
        projectExpenses: newExpenses,
      };

      osDetails.push(newOs);
    });

    return {
      id: serviceOrder?.id,
      client: client?.fantasyName,
      clientId: client?.id,
      collaborator: collaborator?.name,
      serviceType: serviceOrder?.remote,
      status: serviceOrder?.status,
      date: serviceOrder?.date,
      startDate: serviceOrder?.startDate,
      endDate: serviceOrder?.endDate,
      osDetails,
    };
  }
}
