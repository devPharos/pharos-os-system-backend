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

const createServiceOrderBodySchema = z.object({
  companyId: z.string().uuid(),
  collaboratorId: z.string().uuid(),
  clientId: z.string().uuid(),
  date: z.coerce.date(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  totalHours: z.string(),
})

type CreateServiceOrderBodySchema = z.infer<typeof createServiceOrderBodySchema>

@Controller('/service-orders')
@UseGuards(JwtAuthGuard)
export class CreateServiceOrderController {
  constructor(private prisma: PrismaService) {}
  @Post()
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createServiceOrderBodySchema))
    body: CreateServiceOrderBodySchema,
  ) {
    const {
      clientId,
      collaboratorId,
      companyId,
      date,
      endDate,
      startDate,
      totalHours,
    } = body

    if (startDate < endDate) {
      throw new NotAcceptableException(
        'Start date cannot be earlier than end date',
      )
    }

    await this.prisma.serviceOrder.create({
      data: {
        date,
        endDate,
        startDate,
        totalHours,
        client: {
          connect: { id: clientId },
        },
        collaborator: {
          connect: { id: collaboratorId },
        },
        company: {
          connect: { id: companyId },
        },
      },
    })
  }
}
