import { Controller, Get, Headers, Res } from "@nestjs/common";
import { Response } from "express";
import { PdfService } from "./pdf.service";
import { PrismaService } from "src/prisma/prisma.service";

import { z } from "zod";
import { parseISO } from "date-fns";

const getReportPDFSchema = z.object({
  clientid: z.optional(z.string().uuid().nullable()),
  collaboratorid: z.optional(z.string().uuid().nullable()),
  projectid: z.optional(z.string().uuid().nullable()),
  startdate: z.optional(z.string()),
  enddate: z.optional(z.string()),
});

type GetReportPDFSchema = z.infer<typeof getReportPDFSchema>;

@Controller("pdf")
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async generatePdf(
    @Res() res: Response,
    @Headers() header: GetReportPDFSchema,
  ): Promise<void> {
    const { clientid, collaboratorid, enddate, projectid, startdate } = header;

    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where: {
        OR: [
          {
            clientId: clientid || undefined,
            collaboratorId: {
              equals: collaboratorid || undefined,
            },
            serviceOrderDetails: {
              every: {
                projectId: {
                  equals: projectid || undefined,
                },
              },
            },
            startDate: {
              gte: startdate ? parseISO(startdate) : undefined,
              lte: enddate ? parseISO(enddate) : undefined,
            },
            endDate: {
              gte: startdate ? parseISO(startdate) : undefined,
              lte: enddate ? parseISO(enddate) : undefined,
            },
          },
        ],
      },
      select: {
        date: true,
        client: {
          select: {
            fantasyName: true,
          },
        },
        collaborator: {
          select: {
            name: true,
            lastName: true,
            value: true,
          },
        },
        startDate: true,
        endDate: true,

        serviceOrderExpenses: {
          select: {
            value: true,
          },
        },
      },
    });

    const pdfPath = await this.pdfService.generatePdf(serviceOrders);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=output.pdf");
    res.sendFile(pdfPath);
  }
}
