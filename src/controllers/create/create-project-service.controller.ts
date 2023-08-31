import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const createProjectServiceBodySchema = z.object({
  companyId: z.string().uuid(),
  projectId: z.string().uuid(),
  description: z.string(),
  chargesClient: z.boolean(),
  passCollaborator: z.boolean(),
})

type CreateProjectServiceBodySchema = z.infer<
  typeof createProjectServiceBodySchema
>

@Controller('/projects')
@UseGuards(JwtAuthGuard)
export class CreateProjectServiceController {
  constructor(private prisma: PrismaService) {}
  @Post('/service')
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createProjectServiceBodySchema))
    body: CreateProjectServiceBodySchema,
  ) {
    const {
      chargesClient,
      companyId,
      description,
      passCollaborator,
      projectId,
    } = body

    await this.prisma.projectService.create({
      data: {
        description,
        chargesClient,
        passCollaborator,
        company: {
          connect: { id: companyId },
        },
        project: {
          connect: { id: projectId },
        },
      },
    })
  }
}
