import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("/list")
@UseGuards(JwtAuthGuard)
export class ListServiceOrdersController {
  constructor(private prisma: PrismaService) {}
  @Get("/service-orders")
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
          },
        },
      },
    });

    // type SupervisedOs = typeof serviceOrders;

    // const supervisedCollaborators = await this.prisma.collaborator.findMany({
    //   where: {
    //     supervisorId: collaborator?.id,
    //   },
    //   select: {
    //     id: true,
    //   },
    // });

    // if (supervisedCollaborators.length > 0) {
    //   const collaboratorsServiceOrders: SupervisedOs = [];

    //   supervisedCollaborators.forEach(async (collaborator) => {
    //     const os: SupervisedOs = await this.prisma.serviceOrder.findMany({
    //       where: {
    //         collaboratorId: collaborator?.id,
    //       },
    //       select: {
    //         id: true,
    //         clientId: true,
    //         status: true,
    //         startDate: true,
    //         endDate: true,
    //         date: true,
    //         collaborator: {
    //           select: {
    //             name: true,
    //             lastName: true,
    //           },
    //         },
    //       },
    //     });

    //     os.forEach((os) => {
    //       collaboratorsServiceOrders.push(os);
    //     });
    //   });

    //   return collaboratorsServiceOrders;
    // }

    return serviceOrders;
  }
}
