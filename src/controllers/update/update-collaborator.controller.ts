import { Body, Controller, HttpCode, Put, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const updateCollaboratorBodySchema = z.object({
  userId: z.string().uuid(),
  cnpj: z.string(),
})

type UpdateCollaboratorBodySchema = z.infer<typeof updateCollaboratorBodySchema>

@Controller('/accounts')
@UseGuards(JwtAuthGuard)
export class UpdateCollaboratorController {
  constructor(private prisma: PrismaService) {}
  @Put('/collaborator')
  @HttpCode(201)
  async handle(@Body() body: UpdateCollaboratorBodySchema) {
    const { userId, cnpj } = body

    await this.prisma.collaborator.update({
      where: { cnpj },
      data: {
        user: {
          connect: { id: userId },
        },
      },
    })
  }
}
