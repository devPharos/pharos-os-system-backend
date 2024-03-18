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
import { differenceInHours, format, parseISO } from "date-fns";
import { Response } from "express";
import * as fs from "fs";
import { resolve } from "path";
import * as PDFDocument from "pdfkit";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";
import { ServiceOrderProps } from "./pdf.service";

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

interface VerifyProjectValidationProps {
  projectId: string;
  endDate: string;
  startDate: string;
}

@Controller("report")
@UseGuards(JwtAuthGuard)
export class ReportPdfController {
  constructor(private prisma: PrismaService) {}

  async verifyProjectValidation({
    projectId,
    endDate,
    startDate,
  }: VerifyProjectValidationProps): Promise<boolean> {
    const validateProject = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        serviceOrderDetails: {
          where: {
            serviceOrder: {
              AND: [
                {
                  status: {
                    equals: "Aberto",
                  },
                },
                {
                  endDate: {
                    lte: endDate,
                  },
                  startDate: {
                    gte: startDate,
                  },
                },
              ],
            },
          },
        },
      },
    });

    if (validateProject?.serviceOrderDetails.length !== 0) {
      return false;
    }

    return true;
  }

  @Post("pdf")
  async createMonthlyClosingReport(
    @Body() body: CreateMonthlyClosingBodySchema,
    @Res() response: Response,
  ): Promise<any> {
    const { clientId, endDate, selectedProjects, startDate } = body;

    const pdfsPaths = await Promise.all(
      selectedProjects.map(async (projectId) => {
        let hoursToBeBilled = 0;
        let totalValue = 0;
        let expensesTotalValue = 0;

        const isProjectValidated = await this.verifyProjectValidation({
          endDate,
          projectId,
          startDate,
        });

        if (!isProjectValidated) {
          const serviceOrders = await this.prisma.serviceOrder.findMany({
            where: {
              OR: [
                {
                  clientId: clientId || undefined,
                  serviceOrderDetails: {
                    every: {
                      projectId: {
                        equals: projectId,
                      },
                    },
                  },
                  startDate: {
                    gte: startDate,
                    lte: endDate,
                  },
                  endDate: {
                    gte: startDate,
                    lte: endDate,
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

          return serviceOrders;
        }

        const project = await this.prisma.project.findUnique({
          where: {
            id: projectId,
          },
          select: {
            serviceOrderDetails: true,
            serviceOrderExpenses: true,
            hourValue: true,
            name: true,
          },
        });

        project?.serviceOrderDetails.forEach(async (os: any) => {
          const serviceOrder = await this.prisma.serviceOrder.findUnique({
            where: {
              id: os.serviceOrderId,
            },
            select: {
              totalHours: true,
            },
          });

          hoursToBeBilled += Number(serviceOrder?.totalHours);
          totalValue += Number(
            (Number(serviceOrder?.totalHours) *
              Number(project?.hourValue.replace(/\D/g, ""))) /
              100,
          );
        });

        project?.serviceOrderExpenses.forEach(async (os: any) => {
          expensesTotalValue += Number(os.value);
        });

        const client = await this.prisma.client.findUnique({
          where: {
            id: clientId,
          },
          select: {
            paymentDate: true,
            fantasyName: true,
          },
        });

        const closing = await this.prisma.closing.create({
          data: {
            clientId,
            projectId,
            startDate: parseISO(startDate),
            endDate: parseISO(endDate),
            totalValidatedHours: hoursToBeBilled.toString(),
            totalValue: totalValue.toString(),
            taxTotalValue: (totalValue * 0.16).toFixed(2).split(".").join(","),
            expensesTotalValue: expensesTotalValue.toString(),
            paymentDate: client?.paymentDate || "",
          },
        });

        await this.prisma.serviceOrder.updateMany({
          where: {
            serviceOrderDetails: {
              some: {
                projectId,
                AND: [
                  {
                    endDate: {
                      lte: endDate,
                    },
                    startDate: {
                      gte: startDate,
                    },
                  },
                ],
              },
            },
          },
          data: {
            monthly_closing_id: closing.id,
            status: "Faturado",
          },
        });

        const serviceOrders = await this.prisma.serviceOrder.findMany({
          where: {
            OR: [
              {
                clientId,
                serviceOrderDetails: {
                  every: {
                    projectId: {
                      equals: projectId,
                    },
                  },
                },
                startDate: {
                  gte: parseISO(startDate),
                  lte: parseISO(endDate),
                },
                endDate: {
                  gte: parseISO(startDate),
                  lte: parseISO(endDate),
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
                userId: true,
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

        const projectHourValue = project?.hourValue || "";
        const projectName = project?.name || "";
        const pdfPath = await this.generateReportPdf(
          serviceOrders,
          projectName,
          projectHourValue,
        );

        return {
          ...pdfPath,
          projectId,
        };
      }),
    ).then((values) => {
      return values;
    });

    return response.send(pdfsPaths);
  }

  async generateReportPdf(
    serviceOrders: ServiceOrderProps[],
    projectName: string,
    projectHourValue: string,
  ): Promise<any> {
    let ret = null;

    try {
      const path = `${resolve(
        __dirname,
        "..",
        "..",
        "",
        "temp",
      )}/${projectName}.pdf`;

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
        .text(`Fechamento do Projeto ${projectName}`, {
          align: "center",
        });

      const rows = await manipulateServiceOrders(
        serviceOrders,
        projectHourValue,
      );

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
        pathName: projectName,
        users: collaborators,
        serviceOrders,
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
      return res.status(401).json({ error: "Arquivo não pôde ser apagado." });
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
  projectHourValue: string,
): Promise<string[][]> {
  const newOsArr: string[][] = [
    [
      "Emissão",
      "Cliente",
      "Analista",
      "Hr Inicial",
      "Hr Final",
      "Hr Total",
      "Valor",
      "Despesas",
    ],
  ];

  serviceOrders.forEach((os) => {
    const newArr: string[] = [];
    const formattedDate = format(os.date, "dd/MM/yy");
    const formattedStateDate = format(os.startDate, "HH:mm");
    const formattedEndDate = format(os.endDate, "HH:mm");
    const totalHours = differenceInHours(os.endDate, os.startDate);
    const value = totalHours * Number(projectHourValue);
    let expenses = 0;

    os.serviceOrderExpenses.forEach((expense) => {
      expenses += Number(expense.value);
    });

    newArr.push(
      formattedDate,
      os.client.fantasyName,
      os.collaborator.name + " " + os.collaborator.lastName,
      formattedStateDate,
      formattedEndDate,
      `${totalHours.toString()}h`,
      `R$ ${value.toString()},00`,
      `R$ ${expenses.toString()},00`,
    );

    newOsArr.push(newArr);
  });

  const totalArr: string[] = [];
  const totalTaxArr: string[] = [];
  const totalValueArr: string[] = [];
  let totalValue: number = 0;
  let totalHours: number = 0;
  let totalExpenses: number = 0;

  for (let i = 1; i < newOsArr.length; i++) {
    totalArr.splice(0, totalArr.length);
    const hours = parseInt(newOsArr[i][5].split("h")[0]);
    const value = newOsArr[i][6].match(/\d+/);
    const expenses = newOsArr[i][7].match(/\d+/);
    totalValue += value && value[0] ? parseInt(value[0]) : 0;
    totalHours += hours;
    totalExpenses += expenses && expenses[0] ? parseInt(expenses[0]) : 0;

    totalArr.push(
      "Total Atendimentos:",
      "",
      "",
      "",
      "",
      `${totalHours.toString()}h`,
      `R$ ${totalValue.toString()},00`,
      `R$ ${totalExpenses.toString()},00`,
    );
  }
  const value = totalArr[6].match(/\d+/);
  const totalMainValue = value && value[0] ? parseInt(value[0]) : 0;
  const totalTaxes = (totalMainValue * 0.16).toFixed(2).split(".");
  const mainTotalValue = totalMainValue + Number(totalTaxes[0]);

  totalTaxArr.push(
    "Total de Impostos:",
    "",
    "",
    "",
    "",
    "",
    `R$ ${totalTaxes.toString()}`,
    "",
  );

  totalValueArr.push(
    "Total Geral:",
    "",
    "",
    "",
    "",
    "",
    `R$ ${mainTotalValue.toString()},${totalTaxes[1]}`,
    "",
  );

  const newOSIndex = newOsArr.length;
  newOsArr.splice(newOSIndex, 0, totalArr, totalTaxArr, totalValueArr);

  return newOsArr;
}
