import { Module } from "@nestjs/common";
import { PdfService } from "./pdf.service";
import { PdfController } from "./pdf.controller";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  imports: [],
  providers: [PdfService, PrismaService],
  controllers: [PdfController],
})
export class PdfModule {}
