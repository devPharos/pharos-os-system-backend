import { PrismaService } from "src/prisma/prisma.service";
import { StorageService } from "./storage.service";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { StorageController } from "./storage.controller";

@Module({
  imports: [ConfigModule],
  providers: [StorageService, PrismaService],
  controllers: [StorageController],
})
export class StorageModule {}
