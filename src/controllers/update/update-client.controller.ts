import { Body, Controller, HttpCode, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const updateClientBodySchema = z.object({
  businessName: z.string(),
  fantasyName: z.string(),
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
});

type UpdateClientBodySchema = z.infer<typeof updateClientBodySchema>;

@Controller("/update")
@UseGuards(JwtAuthGuard)
export class UpdateClientController {
  constructor(private prisma: PrismaService) {}
  @Put("/client")
  @HttpCode(201)
  async handle(@Body() body: UpdateClientBodySchema) {
    const {
      account,
      accountDigit,
      address,
      agency,
      agencyDigit,
      bank,
      businessName,
      cep,
      city,
      cnpj,
      complement,
      country,
      fantasyName,
      neighborhood,
      number,
      phone,
      pixKey,
      state,
    } = body;

    await this.prisma.client.update({
      where: { cnpj },
      data: {
        account,
        accountDigit,
        address,
        agency,
        agencyDigit,
        bank,
        businessName,
        cep,
        city,
        complement,
        country,
        fantasyName,
        neighborhood,
        number,
        phone,
        pixKey,
        state,
      },
    });
  }
}
