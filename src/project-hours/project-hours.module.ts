import { Module, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ProjectUsedHoursService } from "./update-hours-balance.service";

@Module({
  providers: [PrismaService, ProjectUsedHoursService],
})
export class ProjectHoursModule implements OnModuleInit {
  constructor(
    private readonly projectUpdateUsedHoursService: ProjectUsedHoursService,
  ) {}

  async onModuleInit() {
    this.projectUpdateUsedHoursService.scheduleUpdateProjectUsedHoursSending();
  }
}
