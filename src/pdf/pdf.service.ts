import { Injectable } from "@nestjs/common";
import { format, differenceInHours } from "date-fns";
import * as fs from "fs";
import * as path from "path";
import * as PDFDocument from "pdfkit";

interface ServiceOrderProps {
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
}

interface pdfProps {
  serviceOrders: ServiceOrderProps[];
  startDate: Date;
  endDate: Date;
}

interface closingPdfProps {
  serviceOrders: ServiceOrderProps[];
  projectName: string;
}

export interface pdfReturn {
  path: string;
  name: string;
}

@Injectable()
export class PdfService {
  async generatePdf({
    serviceOrders,
    startDate,
    endDate,
  }: pdfProps): Promise<string> {
    const pdfPath = path.resolve(__dirname, "output.pdf");
    const doc = new PDFDocument();

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

    createTable(doc, rows);

    doc.pipe(fs.createWriteStream(pdfPath));

    doc.end();

    return pdfPath;
  }

  async generateClosingPdf({
    serviceOrders,
    projectName,
  }: closingPdfProps): Promise<pdfReturn> {
    let ret: pdfReturn = {
      name: "",
      path: "",
    };
    const pdfPath = path.resolve(__dirname, "output.pdf");
    const doc = new PDFDocument();
    const pathFile = fs.createWriteStream(pdfPath, {
      encoding: "base64",
    });

    doc.pipe(pathFile);

    doc.image("src/assets/logo-yellow.png", 50, undefined, {
      align: "center",
    });

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Fechamento Projeto ${projectName}`, {
        align: "center",
      });

    const rows = await manipulateServiceOrders(serviceOrders);

    createTable(doc, rows);

    doc.end();

    pathFile.addListener("finish", () => {
      ret = {
        path: pdfPath,
        name: "output.pdf",
      };
    });

    return ret;
  }
}

async function manipulateServiceOrders(
  serviceOrders: ServiceOrderProps[],
  closing?: boolean,
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
    const value = totalHours * Number(os.collaborator.value);
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

  if (!closing) {
    for (let i = 1; i < newOsArr.length; i++) {
      totalArr.splice(0, totalArr.length);
      const hours = parseInt(newOsArr[i][5].split("h")[0]);
      const value = newOsArr[i][6].match(/\d+/);
      const expenses = newOsArr[i][7].match(/\d+/);
      totalValue += value && value[0] ? parseInt(value[0]) : 0;
      totalHours += hours;
      totalExpenses += expenses && expenses[0] ? parseInt(expenses[0]) : 0;

      totalArr.push(
        "Total",
        "",
        "",
        "",
        "",
        `${totalHours.toString()}h`,
        `R$ ${totalValue.toString()},00`,
        `R$ ${totalExpenses.toString()},00`,
      );
    }
  }

  if (closing) {
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
    const totalTaxes = totalMainValue * 0.16;
    const mainTotalValue = totalMainValue + totalTaxes;

    totalTaxArr.push(
      "Total de Impostos:",
      "",
      "",
      "",
      "",
      "",
      `R$ ${totalTaxes.toString()},00`,
      "",
    );

    totalValueArr.push(
      "Total Geral:",
      "",
      "",
      "",
      "",
      "",
      `R$ ${mainTotalValue.toString()},00`,
      "",
    );
  }

  const newOSIndex = newOsArr.length;
  closing
    ? newOsArr.splice(newOSIndex, 0, totalArr, totalTaxArr, totalValueArr)
    : newOsArr.splice(newOSIndex, 0, totalArr);

  return newOsArr;
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
