import {
  Controller,
  Delete,
  Headers,
  HttpCode,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const deleteServiceHeaderSchema = z.object({
  serviceid: z.string().uuid(),
  projectid: z.string().uuid(),
});

type DeleteServiceHeaderSchema = z.infer<typeof deleteServiceHeaderSchema>;

@Controller("/delete")
@UseGuards(JwtAuthGuard)
export class DeleteServiceController {
  constructor(private prisma: PrismaService) {}
  @Delete("/project/service")
  @HttpCode(201)
  async handle(@Headers() header: DeleteServiceHeaderSchema) {
    const { serviceid, projectid } = header;

    console.log(serviceid);
    console.log(projectid);

    const service = await this.prisma.projectService.findUnique({
      where: {
        id: serviceid,
      },
    });

    console.log(service);

    await this.prisma.projectService.delete({
      where: { id: serviceid },
    });

    const services = await this.prisma.projectService.findMany({
      where: {
        projectId: projectid,
      },
    });

    return services;
  }
}
