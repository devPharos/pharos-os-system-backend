import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
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
  complement: z.string().optional(),
  cep: z.string(),
  paymentDate: z.string().optional(),
  paymentWeekDate: z.string().optional(),
  daysAfterClosing: z.string().optional(),
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
      address,
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
      state,
      paymentDate,
      daysAfterClosing,
      paymentWeekDate,
    } = body;

    const existentClient = await this.prisma.client.findUnique({
      where: {
        cnpj,
      },
    });

    if (existentClient) {
      throw new ConflictException("Already has a client with this CNPJ/CPF");
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
    });

    const currentCompany = await this.prisma.company.findUnique({
      where: {
        id: currentUser?.companyId,
      },
    });

    await this.prisma.client.create({
      data: {
        address,
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
        state,
        paymentDate,
        daysAfterClosing,
        paymentWeekDate,
        company: {
          connect: { id: currentCompany?.id },
        },
      },
    });
  }
}
