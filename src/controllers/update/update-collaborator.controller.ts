import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const updateCollaboratorBodySchema = z.object({
  name: z.string(),
  lastName: z.string(),
  supervisorId: z.string().uuid().optional(),
  cnpj: z.string(),
  phone: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  address: z.string(),
  number: z.string(),
  complement: z.string().optional(),
  cep: z.string(),
  bank: z.string(),
  agency: z.string(),
  agencyDigit: z.string().max(1).optional(),
  account: z.string(),
  accountDigit: z.string().max(1).optional(),
  pixKey: z.string().optional(),
});

type UpdateCollaboratorBodySchema = z.infer<
  typeof updateCollaboratorBodySchema
>;

@Controller("/update")
@UseGuards(JwtAuthGuard)
export class UpdateCollaboratorController {
  constructor(private prisma: PrismaService) {}
  @Put("/collaborator")
  @HttpCode(201)
  async handle(@Body() body: UpdateCollaboratorBodySchema) {
    const {
      account,
      accountDigit,
      address,
      agency,
      supervisorId,
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
    } = body;

    await this.prisma.collaborator.update({
      where: { cnpj },
      data: {
        account,
        accountDigit,
        address,
        agency,
        agencyDigit,
        bank,
        cep,
        city,
        complement,
        country,
        lastName,
        name,
        neighborhood,
        number,
        phone,
        pixKey,
        state,
        supervisorId: supervisorId || undefined,
      },
    });
  }
}
