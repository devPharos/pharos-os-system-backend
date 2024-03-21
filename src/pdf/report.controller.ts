import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotAcceptableException,
  NotFoundException,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { differenceInHours, format, parseISO } from "date-fns";
import { Response } from "express";
import * as fs from "fs";
import { resolve } from "path";
import * as PDFDocument from "pdfkit";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";
import { ServiceOrderProps } from "./pdf.service";
import { Project } from "@prisma/client";

const createMonthlyClosingBodySchema = z.object({
  clientId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  selectedProjects: z.array(z.string()),
});

const reportHeader = z.object({
  filename: z.string(),
});

type CreateMonthlyClosingBodySchema = z.infer<
  typeof createMonthlyClosingBodySchema
>;
type ReportHeader = z.infer<typeof reportHeader>;

@Controller("report")
@UseGuards(JwtAuthGuard)
export class ReportPdfController {
  constructor(private prisma: PrismaService) {}

  @Post("pdf")
  async createMonthlyClosingReport(
    @Body() body: CreateMonthlyClosingBodySchema,
    @Res() response: Response,
  ): Promise<any> {
    const { clientId, endDate, selectedProjects, startDate } = body;

    const pdfPaths = await Promise.all(
      selectedProjects.map(async (projectId) => {
        const project = await this.prisma.project.findUnique({
          where: {
            id: projectId,
            AND: [
              {
                status: {
                  equals: "Iniciado",
                },
              },
            ],
          },
          include: {
            serviceOrderDetails: true,
            serviceOrderExpenses: true,
          },
        });

        if (!project) {
          return "Projeto nao encontrado";
          throw new NotFoundException("Projeto não encontrado");
        }

        const isAValidProject = await this.validateProjectOS(
          startDate,
          endDate,
          project,
        );

        if (!isAValidProject) {
          return "Invalid project";
          throw new NotAcceptableException(
            "Existem OS's não validadas nesse período!",
          );
        }

        let hoursToBeBilled = 0;
        let totalValue = 0;

        project.serviceOrderDetails.forEach(async (detail) => {
          const serviceOrder = await this.prisma.serviceOrder.findUnique({
            where: {
              id: detail.serviceOrderId,
            },
            select: {
              totalHours: true,
            },
          });

          if (!serviceOrder) {
            return "OS não encontrada";
            throw new NotFoundException("Ordem de serviço não encontrada");
          }
          const totalHours = parseFloat(serviceOrder?.totalHours);
          const projectHourValue = parseFloat(
            project.hourValue.replace("R$", "").replace(",", "."),
          );
          hoursToBeBilled += totalHours;
          totalValue += totalHours * projectHourValue;
        });

        let totalExpenses = 0;

        project.serviceOrderExpenses.forEach(async (expense) => {
          const expenseValue = parseFloat(
            expense.value.replace("R$", "").replace(",", "."),
          );

          totalExpenses += expenseValue;
        });

        const client = await this.prisma.client.findUnique({
          where: {
            id: clientId,
          },
        });

        if (!client) {
          return "Cliente nao encontrada";
          throw new NotFoundException("Cliente não encontrado");
        }

        const totalTaxes = parseFloat((totalValue * 0.16).toFixed(2));

        const closing = await this.prisma.closing.create({
          data: {
            clientId,
            projectId,
            startDate: parseISO(startDate),
            endDate: parseISO(endDate),
            expensesTotalValue: totalExpenses.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
            paymentDate: client.paymentDate ?? null,
            taxTotalValue: totalTaxes.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
            totalValidatedHours: hoursToBeBilled.toString(),
            totalValue: totalValue.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
          },
        });

        await this.prisma.serviceOrder.updateMany({
          where: {
            AND: [
              {
                clientId,
              },
              {
                startDate: {
                  gte: parseISO(startDate),
                },
              },
              {
                endDate: {
                  lte: parseISO(endDate),
                },
              },
              {
                serviceOrderDetails: {
                  some: {
                    projectId: project.id,
                  },
                },
              },
            ],
          },
          data: {
            monthly_closing_id: closing.id,
            status: "Faturado",
          },
        });

        const serviceOrders = await this.prisma.serviceOrder.findMany({
          where: {
            AND: [
              {
                clientId,
              },
              {
                startDate: {
                  gte: parseISO(startDate),
                },
              },
              {
                endDate: {
                  lte: parseISO(endDate),
                },
              },
              {
                serviceOrderDetails: {
                  some: {
                    projectId: project.id,
                  },
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

        const pdfPaths = await this.generateReportPdf(serviceOrders, project);

        return pdfPaths;
      }),
    ).then((values) => {
      return values;
    });

    return response.send(pdfPaths);
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
      return res.status(401).json({ error: "Arquivo não pôde ser apagado." });
    }
    return res.json({ file: "removed!" });
  }

  async generateReportPdf(
    serviceOrders: ServiceOrderProps[],
    project: Project,
  ): Promise<any> {
    let ret = null;

    try {
      const path = `${resolve(__dirname, "..", "..", "", "temp")}/${
        project.name
      }.pdf`;

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
        .text(`Fechamento do Projeto ${project.name}`, {
          align: "center",
        });

      const rows = await this.manipulateServiceOrders(serviceOrders, project);

      const collaborators: {
        name: string;
        lastName: string;
        value: string;
        userId?: string | null;
      }[] = [];

      serviceOrders.forEach((os) => {
        collaborators.push(os.collaborator);
      });

      createTable(doc, rows);

      doc.pipe(file);

      doc.end();

      ret = {
        path,
        pathName: project.name,
        users: collaborators,
        serviceOrders,
        projectId: project.id,
      };

      return ret;
    } catch (err: any) {
      return { error: err.message, status: 400 };
    }
  }

  async validateProjectOS(
    startDate: string,
    endDate: string,
    project: Project,
  ): Promise<boolean> {
    const projectServiceOrdersInThisPeriod =
      await this.prisma.serviceOrder.findMany({
        where: {
          AND: [
            {
              startDate: {
                gte: parseISO(startDate),
              },
            },
            {
              endDate: {
                lte: parseISO(endDate),
              },
            },
            {
              serviceOrderDetails: {
                some: {
                  projectId: project.id,
                },
              },
            },
          ],
        },
      });

    const areAllOsValidated =
      projectServiceOrdersInThisPeriod.filter((os) => os.status === "Validado")
        .length > 0;

    return areAllOsValidated;
  }

  async manipulateServiceOrders(
    serviceOrders: ServiceOrderProps[],
    project: Project,
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
      const startDate = format(serviceOrder.startDate, "dd/MM/yy");
      const endDate = format(serviceOrder.endDate, "dd/MM/yy");
      const totalHours = differenceInHours(
        serviceOrder.endDate,
        serviceOrder.startDate,
      );
      const projectHourValue = parseFloat(
        project.hourValue.replace("R$", "").replace(",", "."),
      );
      const value = totalHours * projectHourValue;
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
        serviceOrder.collaborator.name +
          " " +
          serviceOrder.collaborator.lastName,
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

        totalRow.push(
          "Total Atendimentos:",
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
      }
    });

    rows.push(totalRow);

    const totalMainValue = parseFloat(
      totalRow[6].replace("R$", "").replace(",", "."),
    );
    const totalTaxes = parseFloat((totalMainValue * 0.16).toFixed(2));
    const afterTaxesValue = totalMainValue + totalTaxes;
    const totalTaxesRow: string[] = [];

    totalTaxesRow.push(
      "Total de Impostos:",
      "",
      "",
      "",
      "",
      "",
      totalTaxes.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      "",
    );

    rows.push(totalTaxesRow);

    const totalValueRow: string[] = [];

    totalValueRow.push(
      "Total Geral:",
      "",
      "",
      "",
      "",
      "",
      afterTaxesValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      "",
    );

    rows.push(totalValueRow);

    return rows;
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
