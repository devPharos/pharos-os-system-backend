import {
  Body,
  Controller,
  HttpCode,
  NotAcceptableException,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const createProjectBodySchema = z.object({
  companyId: z.string().uuid(),
  clientId: z.string().uuid(),
  coordinatorId: z.string().uuid(),
  name: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  deliveryForecast: z.string(),
  hoursForecast: z.string(),
  hoursBalance: z.string(),
  hourValue: z.string(),
});

type CreateProjectBodySchema = z.infer<typeof createProjectBodySchema>;

@Controller("/projects")
@UseGuards(JwtAuthGuard)
export class CreateProjectController {
  constructor(private prisma: PrismaService) {}
  @Post()
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createProjectBodySchema))
    body: CreateProjectBodySchema,
  ) {
    const {
      clientId,
      companyId,
      coordinatorId,
      deliveryForecast,
      endDate,
      hourValue,
      hoursBalance,
      hoursForecast,
      name,
      startDate,
    } = body;

    if (startDate < endDate) {
      throw new NotAcceptableException(
        "Start date cannot be earlier than end date",
      );
    }

    await this.prisma.project.create({
      data: {
        deliveryForecast,
        endDate,
        hourValue,
        hoursBalance,
        hoursForecast,
        name,
        startDate,
        company: {
          connect: { id: companyId },
        },
        client: {
          connect: { id: clientId },
        },
        collaborator: {
          connect: { id: coordinatorId },
        },
      },
    });
  }
}
