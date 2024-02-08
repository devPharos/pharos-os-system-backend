import { Module, OnModuleInit } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EmailController } from "./email.controller";
import { PrismaService } from "src/prisma/prisma.service";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { EmailSchedulerService } from "./schedule-email.service";

@Module({
  providers: [EmailService, EmailSchedulerService, PrismaService],
  controllers: [EmailController],
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "..", "src", "assets"),
    }),
  ],
})
export class EmailModule implements OnModuleInit {
  constructor(private readonly emailSchedulerService: EmailSchedulerService) {}

  async onModuleInit() {
    this.emailSchedulerService.scheduleEmailSending();
  }
}
