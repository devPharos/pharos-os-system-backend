import {
  Body,
  ConflictException,
  Controller,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const createCollaboratorBodySchema = z.object({
  name: z.string(),
  lastName: z.string(),
  supervisorId: z.string().uuid().optional().nullable(),
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

type CreateCollaboratorBodySchema = z.infer<
  typeof createCollaboratorBodySchema
>;

@Controller("/accounts")
@UseGuards(JwtAuthGuard)
export class CreateCollaboratorController {
  constructor(private prisma: PrismaService) {}
  @Post("/collaborator")
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

    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
      },
      select: {
        companyId: true,
      },
    });

    const existentCollaborator = await this.prisma.client.findUnique({
      where: {
        cnpj,
      },
    });

    if (existentCollaborator) {
      throw new ConflictException(
        "Already has a collaborator with this CNPJ/CPF",
      );
    }

    if (supervisorId) {
      const collaborator = this.prisma.collaborator.create({
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
            connect: {
              id: currentUser?.companyId || "",
            },
          },
          supervisor: {
            connect: {
              id: supervisorId,
            },
          },
        },
      });

      return collaborator;
    }

    const collaborator = this.prisma.collaborator.create({
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
          connect: {
            id: currentUser?.companyId || "",
          },
        },
      },
    });

    return collaborator;
  }
}
