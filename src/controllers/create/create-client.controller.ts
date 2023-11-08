import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const createClientBodySchema = z.object({
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

type CreateClientBodySchema = z.infer<typeof createClientBodySchema>;

@Controller("/accounts")
@UseGuards(JwtAuthGuard)
export class CreateClientController {
  constructor(private prisma: PrismaService) {}
  @Post("/client")
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body() body: CreateClientBodySchema,
  ) {
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

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
    });

    const currentCompany = await this.prisma.company.findUnique({
      where: {
        id: currentUser?.companyId,
      },
    });

    await this.prisma.client.upsert({
      where: { cnpj },
      create: {
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
        company: {
          connect: { id: currentCompany?.id },
        },
      },
      update: {
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
        company: {
          connect: { id: currentCompany?.id },
        },
      },
    });
  }
}
