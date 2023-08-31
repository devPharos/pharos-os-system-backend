import {
  Body,
  Controller,
  HttpCode,
  NotAcceptableException,
  Post,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const createServiceOrderDetailsBodySchema = z.object({
  companyId: z.string().uuid(),
  serviceOrderId: z.string().uuid(),
  projectId: z.string().uuid(),
  projectServiceId: z.string().uuid(),
  description: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})

type CreateServiceOrderDetailsBodySchema = z.infer<
  typeof createServiceOrderDetailsBodySchema
>

@Controller('/service-orders')
@UseGuards(JwtAuthGuard)
export class CreateServiceOrderDetailsController {
  constructor(private prisma: PrismaService) {}
  @Post('/details')
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createServiceOrderDetailsBodySchema))
    body: CreateServiceOrderDetailsBodySchema,
  ) {
    const {
      companyId,
      description,
      endDate,
      projectId,
      projectServiceId,
      serviceOrderId,
      startDate,
    } = body

    if (startDate < endDate) {
      throw new NotAcceptableException(
        'Start date cannot be earlier than end date',
      )
    }

    await this.prisma.serviceOrderDetails.create({
      data: {
        description,
        endDate,
        startDate,
        company: {
          connect: { id: companyId },
        },
        project: {
          connect: { id: projectId },
        },
        projectServices: {
          connect: { id: projectServiceId },
        },
        serviceOrder: {
          connect: { id: serviceOrderId },
        },
      },
    })
  }
}
