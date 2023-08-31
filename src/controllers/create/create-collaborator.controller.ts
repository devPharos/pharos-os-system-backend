import {
  Body,
  ConflictException,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from 'src/auth/current-user.decorator'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { UserPayload } from 'src/auth/jwt.strategy'
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const createCollaboratorBodySchema = z.object({
  name: z.string(),
  lastName: z.string(),
  cnpj: z.string(),
  phone: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  address: z.string(),
  number: z.string(),
  complement: z.string(),
  cep: z.string(),
  bank: z.string(),
  agency: z.string(),
  agencyDigit: z.string().max(1),
  account: z.string(),
  accountDigit: z.string().max(1),
  pixKey: z.string(),
})

type CreateCollaboratorBodySchema = z.infer<typeof createCollaboratorBodySchema>

@Controller('/accounts')
@UseGuards(JwtAuthGuard)
export class CreateCollaboratorController {
  constructor(private prisma: PrismaService) {}
  @Post('/collaborator')
  async handle(
    @Body(new ZodValidationPipe(createCollaboratorBodySchema))
    body: CreateCollaboratorBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const {
      account,
      accountDigit,
      address,
      agency,
      agencyDigit,
      bank,
      cep,
      city,
      cnpj,
      complement,
      country,
      lastName,
      name,
      neighborhood,
      number,
      phone,
      pixKey,
      state,
    } = body

    const collaboratorWithSameCnpj = await this.prisma.collaborator.findUnique({
      where: { cnpj },
    })

    if (collaboratorWithSameCnpj) {
      throw new ConflictException('Collaborator with same cnpj already exists')
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
    })

    const currentCompany = await this.prisma.company.findUnique({
      where: {
        id: currentUser?.companyId,
      },
    })

    await this.prisma.collaborator.create({
      data: {
        account,
        accountDigit,
        address,
        agency,
        agencyDigit,
        bank,
        cep,
        city,
        cnpj,
        complement,
        country,
        lastName,
        name,
        neighborhood,
        number,
        phone,
        pixKey,
        state,
        company: {
          connect: { id: currentCompany?.id },
        },
      },
    })
  }
}
