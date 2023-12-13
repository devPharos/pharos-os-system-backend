import { Controller, Get, Headers, Res } from "@nestjs/common";
import { Response } from "express";
import { PdfService } from "./pdf.service";
import { PrismaService } from "src/prisma/prisma.service";

import { z } from "zod";

const getReportPDFSchema = z.object({
  collaboratorId: z.string().uuid(),
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
    const { collaboratorId } = header;

    const serviceOrders: {
      date: Date;
      startDate: Date;
      endDate: Date;
      client: {
        fantasyName: string;
      };
      collaborator: {
        name: string;
        lastName: string;
        value: string;
      };
      serviceOrderExpenses: {
        value: string;
      }[];
    }[] = await this.prisma.serviceOrder.findMany({
      where: {
        collaboratorId,
        AND: {
          startDate: {
            gte: "2023-10-01T00:00:00.000Z",
            lte: "2023-10-31T00:00:00.000Z",
          },
          endDate: {
            gte: "2023-10-01T00:00:00.000Z",
            lte: "2023-10-31T00:00:00.000Z",
          },
        },
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
