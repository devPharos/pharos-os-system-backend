import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const editProfileBodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  number: z.string().min(1),
  cep: z.string().min(1),
  complement: z.string().min(1),
});

type EditProfileBodySchema = z.infer<typeof editProfileBodySchema>;

@Controller("/profile")
@UseGuards(JwtAuthGuard)
export class EditProfileController {
  constructor(private prisma: PrismaService) {}
  @Post("")
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body() body: EditProfileBodySchema,
  ) {
    const { address, cep, complement, firstName, lastName, number, phone } =
      body;

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
    });

    const currentCollaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: currentUser?.id,
      },
    });
    await this.prisma.collaborator.update({
      where: {
        cnpj: currentCollaborator?.cnpj,
      },
      data: {
        address,
        cep,
        complement,
        name: firstName,
        lastName,
        number,
        phone,
      },
    });
  }
}
