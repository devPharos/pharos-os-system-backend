import { Module } from "@nestjs/common";
import { PdfService } from "./pdf.service";
import { PdfController } from "./pdf.controller";
import { PrismaService } from "src/prisma/prisma.service";
import { ReportPdfController } from "./report.controller";

@Module({
  imports: [],
  providers: [PdfService, PrismaService],
  controllers: [PdfController, ReportPdfController],
})
export class PdfModule {}
