import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const createFileBodySchema = z.object({
  companyId: z.string().uuid(),
  name: z.string(),
  size: z.string(),
  key: z.string(),
  url: z.string(),
})

type CreateFileBodySchema = z.infer<typeof createFileBodySchema>

@Controller('/files')
@UseGuards(JwtAuthGuard)
export class CreateFileController {
  constructor(private prisma: PrismaService) {}
  @Post()
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createFileBodySchema))
    body: CreateFileBodySchema,
  ) {
    const { companyId, key, name, size, url } = body

    await this.prisma.file.create({
      data: {
        key,
        name,
        size,
        url,
        company: {
          connect: { id: companyId },
        },
      },
    })
  }
}
