import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { getMonth, getYear, parseISO } from "date-fns";
import { Response } from "express";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";
import { PdfService, pdfReturn } from "./pdf.service";
import fs from "node:fs";

const createMonthlyClosingBodySchema = z.object({
  clientId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  selectedProjects: z.array(z.string()),
});

type CreateMonthlyClosingBodySchema = z.infer<
  typeof createMonthlyClosingBodySchema
>;

@Controller("/create")
@UseGuards(JwtAuthGuard)
export class CreateMonthlyClosingController {
  constructor(
    private prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  @Post("/closing")
  @HttpCode(201)
  async handle(
    @Body() body: CreateMonthlyClosingBodySchema,
    @Res() response: Response,
  ) {
    const { clientId, endDate, selectedProjects, startDate } = body;
    // await Promise.all(
    //   selectedProjects.map(async (projectId) => {
    //     let hoursToBeBilled = 0;
    //     let totalValue = 0;
    //     let expensesTotalValue = 0;

    //     const validateProject = await this.prisma.project.findUnique({
    //       where: {
    //         id: projectId,
    //       },
    //       include: {
    //         serviceOrderDetails: {
    //           where: {
    //             serviceOrder: {
    //               AND: [
    //                 {
    //                   status: {
    //                     equals: "Aberto",
    //                   },
    //                 },
    //                 {
    //                   endDate: {
    //                     lte: endDate,
    //                   },
    //                   startDate: {
    //                     gte: startDate,
    //                   },
    //                 },
    //               ],
    //             },
    //           },
    //         },
    //       },
    //     });

    //     if (validateProject?.serviceOrderDetails.length !== 0) {
    //       // const serviceOrders = await this.prisma.serviceOrder.findMany({
    //       //   where: {
    //       //     OR: [
    //       //       {
    //       //         clientId: clientId || undefined,
    //       //         serviceOrderDetails: {
    //       //           every: {
    //       //             projectId: {
    //       //               equals: projectId,
    //       //             },
    //       //           },
    //       //         },
    //       //         startDate: {
    //       //           gte: startDate,
    //       //           lte: endDate,
    //       //         },
    //       //         endDate: {
    //       //           gte: startDate,
    //       //           lte: endDate,
    //       //         },
    //       //       },
    //       //     ],
    //       //   },
    //       //   select: {
    //       //     date: true,
    //       //     client: {
    //       //       select: {
    //       //         fantasyName: true,
    //       //       },
    //       //     },
    //       //     collaborator: {
    //       //       select: {
    //       //         name: true,
    //       //         lastName: true,
    //       //         value: true,
    //       //       },
    //       //     },
    //       //     startDate: true,
    //       //     endDate: true,

    //       //     serviceOrderExpenses: {
    //       //       select: {
    //       //         value: true,
    //       //       },
    //       //     },
    //       //   },
    //       // });

    //       // const pdfPath = await this.pdfService.generatePdf({serviceOrders});

    //       // response.setHeader("Content-Type", "application/pdf");
    //       // response.setHeader(
    //       //   "Content-Disposition",
    //       //   "attachment; filename=output.pdf",
    //       // );

    //       // response.sendFile(pdfPath);
    //       return response.send("download report");
    //     }

    //     const project = await this.prisma.project.findUnique({
    //       where: {
    //         id: projectId,
    //       },
    //       select: {
    //         serviceOrderDetails: true,
    //         serviceOrderExpenses: true,
    //         hourValue: true,
    //         name: true,
    //       },
    //     });

    //     project?.serviceOrderDetails.forEach(async (os) => {
    //       const serviceOrder = await this.prisma.serviceOrder.findUnique({
    //         where: {
    //           id: os.serviceOrderId,
    //         },
    //         select: {
    //           totalHours: true,
    //         },
    //       });

    //       hoursToBeBilled += Number(serviceOrder?.totalHours);
    //       totalValue += Number(
    //         Number(serviceOrder?.totalHours) * Number(project?.hourValue),
    //       );
    //     });

    //     project?.serviceOrderExpenses.forEach(async (os) => {
    //       expensesTotalValue += Number(os.value);
    //     });

    //     const client = await this.prisma.client.findUnique({
    //       where: {
    //         id: clientId,
    //       },
    //       select: {
    //         paymentDate: true,
    //       },
    //     });

    //     const closing = await this.prisma.closing.create({
    //       data: {
    //         clientId,
    //         projectId,
    //         period: `${getYear(new Date())}${getMonth(new Date())}`,
    //         totalValidatedHours: hoursToBeBilled.toString(),
    //         totalValue: totalValue.toString(),
    //         taxTotalValue: (totalValue * 0.16).toString(),
    //         expensesTotalValue: expensesTotalValue.toString(),
    //         paymentDate: client?.paymentDate || "",
    //       },
    //     });

    //     await this.prisma.serviceOrder.updateMany({
    //       where: {
    //         serviceOrderDetails: {
    //           some: {
    //             projectId,
    //             AND: [
    //               {
    //                 endDate: {
    //                   lte: endDate,
    //                 },
    //                 startDate: {
    //                   gte: startDate,
    //                 },
    //               },
    //             ],
    //           },
    //         },
    //       },
    //       data: {
    //         monthly_closing_id: closing.id,
    //         status: "Faturado",
    //       },
    //     });

    //     const serviceOrders = await this.prisma.serviceOrder.findMany({
    //       where: {
    //         OR: [
    //           {
    //             clientId,
    //             serviceOrderDetails: {
    //               every: {
    //                 projectId: {
    //                   equals: projectId,
    //                 },
    //               },
    //             },
    //             startDate: {
    //               gte: parseISO(startDate),
    //               lte: parseISO(endDate),
    //             },
    //             endDate: {
    //               gte: parseISO(startDate),
    //               lte: parseISO(endDate),
    //             },
    //           },
    //         ],
    //       },
    //       select: {
    //         date: true,
    //         client: {
    //           select: {
    //             fantasyName: true,
    //           },
    //         },
    //         collaborator: {
    //           select: {
    //             name: true,
    //             lastName: true,
    //             value: true,
    //           },
    //         },
    //         startDate: true,
    //         endDate: true,

    //         serviceOrderExpenses: {
    //           select: {
    //             value: true,
    //           },
    //         },
    //       },
    //     });

    //     const pdfPath = await this.pdfService.generateClosingPdf({
    //       serviceOrders,
    //       projectName: project?.name || "",
    //     });

    //     response.setHeader("Content-Type", "application/pdf");
    //     response.setHeader(
    //       "Content-Disposition",
    //       `attachment; filename=fechamento${projectId}.pdf`,
    //     );

    //     return pdfPath;
    //   }),
    // ).then((values) => {
    //   console.log("retorno", values);
    // });

    // const pdfPath = await this.pdfService.generateClosingPdf({
    //   serviceOrders: [],
    //   projectName: "",
    // });

    // console.log(pdfPath);

    // response.setHeader("Content-Type", "application/pdf");
    // response.setHeader(
    //   "Content-Disposition",
    //   `attachment; filename = fechamento.pdf`,
    // );

    return response.status(201).send();
  }

  @Get("/closing")
  async downloadPdf() {}
}
