import {
  Body,
  ConflictException,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common'
import { hash } from 'bcryptjs'
import { CurrentUser } from 'src/auth/current-user.decorator'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { UserPayload } from 'src/auth/jwt.strategy'
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const createUserBodySchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'COLLABORATOR', 'CLIENT']),
  password: z.string(),
})

type CreateUserBodySchema = z.infer<typeof createUserBodySchema>

@Controller('/accounts')
@UseGuards(JwtAuthGuard)
export class CreateUserController {
  constructor(private prisma: PrismaService) {}

  @Post('/user')
  async handle(
    @Body(new ZodValidationPipe(createUserBodySchema))
    body: CreateUserBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { email, password, role } = body

    const userWithSameEmail = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (userWithSameEmail) {
      throw new ConflictException('User with same email address already exists')
    }

    const hashedPassword = await hash(password, 8)

    const group = await this.prisma.userGroups.findFirst({
      where: {
        group: {
          equals: role,
        },
      },
    })

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
    })

    const currentCompany = await this.prisma.company.findUnique({
      where: {
        id: currentUser?.companyId,
      },
    })

    await this.prisma.user.create({
      data: {
        company: {
          connect: { cnpj: currentCompany?.cnpj },
        },
        email,
        password: hashedPassword,
        group: {
          connect: { id: group?.id },
        },
      },
    })
  }
}
