import { Injectable } from "@nestjs/common";
import { format, differenceInHours } from "date-fns";
import * as fs from "fs";
import * as path from "path";
import * as PDFDocument from "pdfkit";

interface pdfProps {
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

@Injectable()
export class PdfService {
  async generatePdf(serviceOrders: pdfProps[]): Promise<string> {
    const pdfPath = path.resolve(__dirname, "output.pdf");
    const doc = new PDFDocument();

    doc.image("src/assets/logo-yellow.png", 50, undefined, {
      align: "center",
    });

    const rows = await manipulateServiceOrders(serviceOrders);

    createTable(doc, rows);

    doc.pipe(fs.createWriteStream(pdfPath));

    doc.end();

    return pdfPath;
  }
}

async function manipulateServiceOrders(
  serviceOrders: pdfProps[],
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
      os.collaborator.name + os.collaborator.lastName,
      formattedStateDate,
      formattedEndDate,
      totalHours.toString(),
      `${value.toString()},00`,
      `${expenses.toString()},00`,
    );

    newOsArr.push(newArr);
  });

  const totalArr: string[] = [];
  let totalValue: number = 0;
  let totalHours: number = 0;
  let totalExpenses: number = 0;

  for (let i = 1; i < newOsArr.length; i++) {
    totalArr.splice(0, totalArr.length);
    const hours = parseInt(newOsArr[i][5].split(",")[0]);
    const value = parseInt(newOsArr[i][6].split(",")[0]);
    const expenses = parseInt(newOsArr[i][7].split(",")[0]);
    totalValue += value;
    totalHours += hours;
    totalExpenses += expenses;

    totalArr.push(
      "",
      "",
      "",
      "",
      "",
      totalHours.toString(),
      totalValue.toString(),
      totalExpenses.toString(),
    );
  }

  const newOSIndex = newOsArr.length;
  newOsArr.splice(newOSIndex, 0, totalArr);

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
        doc.fillColor("#111111").fontSize(10).text(cell, currentX, textY, {
          width: 100,
        });
        doc.font("Helvetica");
      } else {
        const textY = currentY + (20 - 8) / 2;
        const textX =
          index === 0
            ? currentX + 10
            : index !== 1 && index !== 2
              ? currentX + (40 - doc.widthOfString(cell)) / 2
              : currentX;

        doc.fillColor("#111111").fontSize(8).text(cell, textX, textY, {
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
