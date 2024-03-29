import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { differenceInHours, format, getMilliseconds, parseISO } from "date-fns";
import { Response } from "express";
import * as fs from "fs";
import { resolve } from "path";
import * as PDFDocument from "pdfkit";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";
import { ServiceOrderProps } from "./pdf.service";

const createOsReportBodySchema = z.object({
  clientId: z.optional(z.string().uuid().nullable()),
  collaboratorId: z.optional(z.string().uuid().nullable()),
  projectId: z.optional(z.string().uuid().nullable()),
  startDate: z.string(),
  endDate: z.string(),
});

const reportHeader = z.object({
  filename: z.string(),
});

type CreateOsReportBodySchema = z.infer<typeof createOsReportBodySchema>;
type ReportHeader = z.infer<typeof reportHeader>;

interface pdfProps {
  serviceOrders: ServiceOrderProps[];
  startDate: Date;
  endDate: Date;
}

@Controller("os-report")
@UseGuards(JwtAuthGuard)
export class OsReportPdfController {
  constructor(private prisma: PrismaService) {}

  @Post("pdf")
  async createOsReport(
    @Body() body: CreateOsReportBodySchema,
    @Res() response: Response,
  ): Promise<any> {
    const { clientId, collaboratorId, endDate, projectId, startDate } = body;

    const newEndDate = new Date(parseISO(endDate));

    newEndDate.setHours(23);
    newEndDate.setMinutes(59);
    newEndDate.setSeconds(59);

    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where: {
        AND: [
          {
            clientId: clientId || undefined,
          },
          {
            collaboratorId: {
              equals: collaboratorId || undefined,
            },
          },
          {
            serviceOrderDetails: {
              some: {
                projectId: {
                  equals: projectId || undefined,
                },
              },
            },
          },
          {
            startDate: {
              gte: parseISO(startDate),
            },
          },
          {
            endDate: {
              lte: newEndDate.toISOString(),
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
        serviceOrderDetails: {
          select: {
            description: true,
            startDate: true,
            endDate: true,
            project: {
              select: {
                name: true,
                hourValue: true,
              },
            },
          },
        },
        serviceOrderExpenses: {
          select: {
            value: true,
          },
        },
      },
    });

    const pdfPath = await this.generateReportPdf({
      endDate: parseISO(endDate),
      serviceOrders,
      startDate: parseISO(startDate),
    });

    return response.send(pdfPath);
  }

  async generateReportPdf({
    endDate,
    serviceOrders,
    startDate,
  }: pdfProps): Promise<any> {
    let ret = null;
    const fileName = `RelatórioDeOS${getMilliseconds(new Date())}`;

    try {
      const path = `${resolve(
        __dirname,
        "..",
        "..",
        "",
        "temp",
      )}/${fileName}.pdf`;

      let doc = null;
      let file = null;

      doc = new PDFDocument({ margin: 25, layout: "portrait" });
      file = fs.createWriteStream(path, {
        encoding: "base64",
      });

      doc.image("src/assets/logo-yellow.png", 50, undefined, {
        align: "center",
      });

      doc
        .font("Helvetica")
        .fontSize(10)
        .text(
          `Ordens de Serviço de ${format(startDate, "dd/MM/yyyy")} a ${format(
            endDate,
            "dd/MM/yyyy",
          )}`,
          {
            align: "center",
          },
        );

      const rows = await manipulateServiceOrders(serviceOrders);

      const details: {
        serviceOrder: {
          date: Date;
          startDate: Date;
          endDate: Date;
          project: string;
          collaborator: string;
        };
        description: string;
      }[] = [];

      serviceOrders.forEach((os) => {
        os.serviceOrderDetails?.forEach((detail) => {
          if (
            detail.description &&
            detail.startDate &&
            detail.endDate &&
            detail.project?.name
          ) {
            details.push({
              description: detail.description,
              serviceOrder: {
                collaborator:
                  os.collaborator.name + " " + os.collaborator.lastName,
                date: os.date,
                startDate: detail.startDate,
                endDate: detail.endDate,
                project: detail.project?.name,
              },
            });
          }
        });
      });

      createTable(doc, rows);

      doc.addPage();

      doc.font("Helvetica-Bold").fontSize(12).text(`Detalhamento`, {
        align: "left",
      });

      doc.moveDown(3);

      for (let i = 0; i < details.length; i++) {
        const description = details[i].description;

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("#1a1a1a")
          .text(`Emissão: `, {
            continued: true,
            align: "left",
          })
          .font("Helvetica")
          .text(` ${format(details[i].serviceOrder.date, "dd/MM/yyyy")}   `, {
            continued: true,
            align: "left",
          })
          .font("Helvetica-Bold")
          .text(`Hora inicial: `, {
            continued: true,
            align: "left",
          })
          .font("Helvetica")
          .text(`${format(details[i].serviceOrder.startDate, "hh:mm")}   `, {
            continued: true,
            align: "left",
          })
          .font("Helvetica-Bold")
          .text(`Hora final: `, {
            continued: true,
            align: "left",
          })
          .font("Helvetica")
          .text(`${format(details[i].serviceOrder.endDate, "hh:mm")}   `, {
            continued: true,
            align: "left",
          })
          .font("Helvetica-Bold")
          .text(`Projeto: `, {
            continued: true,
            align: "left",
          })
          .font("Helvetica")
          .text(`${details[i].serviceOrder.project}   `, {
            continued: true,
            align: "left",
          })
          .font("Helvetica-Bold")
          .text(`Analista: `, {
            continued: true,
            align: "left",
          })
          .font("Helvetica")
          .text(`${details[i].serviceOrder.collaborator}`, {
            align: "left",
          });

        doc.moveDown();

        doc.font("Helvetica-Bold").fontSize(9).text(`Descrição`);

        doc.font("Helvetica").fontSize(10).text(description);

        doc.moveDown(2);
      }

      doc.pipe(file);

      doc.end();

      ret = {
        path,
        pathName: fileName,
      };

      return ret;
    } catch (err: any) {
      return { error: err.message, status: 400 };
    }
  }

  @Get("pdf")
  async downloadReportPdf(
    @Res() res: Response,
    @Headers() header: ReportHeader,
  ): Promise<any> {
    const { filename } = header;
    const name = `${filename}.pdf`;

    return res.download(
      `${resolve(__dirname, "..", "..", "", "temp")}/${name}`,
      name,
    );
  }

  @Delete("pdf")
  async removeReportPdf(
    @Res() res: Response,
    @Headers() header: ReportHeader,
  ): Promise<any> {
    const { filename } = header;
    const name = `${filename}.pdf`;

    try {
      fs.unlinkSync(`${resolve(__dirname, "..", "..", "", "temp")}/${name}`);
    } catch (err) {
      return res.json({ error: "Arquivo não pôde ser apagado." });
    }

    return res.json({ file: "removed!" });
  }
}

function createTable(doc: PDFKit.PDFDocument, rows: string[][]) {
  const cellPadding = 10;

  let currentY = 150;

  rows.forEach((row, rowIndex) => {
    let currentX = 50;

    if (rowIndex % 2 !== 0 && rowIndex !== 0) {
      doc.rect(50, currentY, 520, 20).fill("#EFEFEF");
    }

    row.forEach((cell, index) => {
      if (rowIndex === 0) {
        const textY = currentY + (20 - 10) / 2;

        doc.font("Helvetica-Bold");
        doc.fillColor("#111111").fontSize(8).text(cell, currentX, textY, {
          width: 100,
        });
        doc.font("Helvetica");
      } else {
        const textY = currentY + (20 - 8) / 2;
        const textX =
          index === 0
            ? currentX + 8
            : index !== 1 && index !== 2
              ? currentX + (40 - doc.widthOfString(cell)) / 2
              : currentX;

        doc.fillColor("#111111").fontSize(6).text(cell, textX, textY, {
          width: 100,
        });
      }

      if (index === 1 || index === 2) {
        currentX += 100 + cellPadding;
      } else {
        currentX += 40 + cellPadding;
      }
    });

    currentY += 12 + cellPadding;
  });
}

async function manipulateServiceOrders(
  serviceOrders: ServiceOrderProps[],
): Promise<string[][]> {
  const titles: string[] = [
    "Emissão",
    "Cliente",
    "Analista",
    "Hr Inicial",
    "Hr Final",
    "Hr Total",
    "Valor",
    "Despesas",
  ];

  const rows: string[][] = [titles];

  serviceOrders.forEach((serviceOrder) => {
    const row: string[] = [];
    const date = format(serviceOrder.date, "dd/MM/yy");
    const startDate = format(serviceOrder.startDate, "HH:mm");
    const endDate = format(serviceOrder.endDate, "HH:mm");
    const totalHours = differenceInHours(
      serviceOrder.endDate,
      serviceOrder.startDate,
    );
    const hourValue = parseFloat(
      serviceOrder.collaborator.value.replace("R$", "").replace(",", "."),
    );
    const value = totalHours * hourValue;
    let expenses = 0;

    serviceOrder.serviceOrderExpenses.forEach((expense) => {
      const expenseValue = parseFloat(
        expense.value.replace("R$", "").replace(",", "."),
      );
      expenses += expenseValue;
    });

    row.push(
      date,
      serviceOrder.client.fantasyName,
      serviceOrder.collaborator.name + " " + serviceOrder.collaborator.lastName,
      startDate,
      endDate,
      `${totalHours}h`,
      value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      expenses.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    );

    rows.push(row);
  });

  let totalHours = 0;
  let totalValue = 0;
  let totalExpenses = 0;
  const totalRow: string[] = [];

  rows.forEach((row, index) => {
    if (index !== 0) {
      const hours = parseInt(row[5].replace("h", ""));
      const value = parseFloat(row[6].replace("R$", "").replace(",", "."));
      const expenses = parseFloat(row[7].replace("R$", "").replace(",", "."));

      totalHours += hours;
      totalValue += value;
      totalExpenses += expenses;
    }
  });

  totalRow.push(
    "Total",
    "",
    "",
    "",
    "",
    `${totalHours}h`,
    totalValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
    totalExpenses.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
  );

  rows.push(totalRow);

  return rows;
}
