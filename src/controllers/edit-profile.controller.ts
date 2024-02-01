import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/auth/current-user.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const avatarImgFileSchema = z.object({
  fileId: z.string(),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.string(),
});

const editProfileBodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  number: z.string().min(1),
  cep: z.string().min(1),
  complement: z.string().min(1),
  file: avatarImgFileSchema.optional(),
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
    const {
      address,
      cep,
      complement,
      firstName,
      lastName,
      number,
      phone,
      file,
    } = body;

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
    });

    const currentCollaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: currentUser?.id,
      },
    });

    let fileId = "";

    if (file) {
      const newFile = await this.prisma.file.upsert({
        where: {
          fileId: file.fileId,
        },
        create: {
          fileId: file.fileId,
          name: file.fileName,
          size: file.fileSize,
          url: file.fileUrl,
          companyId: currentCollaborator?.companyId || "",
        },
        update: {
          fileId: file.fileId,
          name: file.fileName,
          size: file.fileSize,
          url: file.fileUrl,
          companyId: currentCollaborator?.companyId || "",
        },
      });

      fileId = newFile.id;
    }

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
        fileId: fileId !== "" ? fileId : null,
      },
    });
  }
}
