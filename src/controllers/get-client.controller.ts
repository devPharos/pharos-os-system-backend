import { Headers, Controller, Get, HttpCode, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const getClientSchema = z.object({
  id: z.string().uuid(),
});

type GetClientHeaderSchema = z.infer<typeof getClientSchema>;

@Controller("/client")
@UseGuards(JwtAuthGuard)
export class GetClientDataController {
  constructor(private prisma: PrismaService) {}
  @Get("/data")
  @HttpCode(201)
  async handle(@Headers() header: GetClientHeaderSchema) {
    const { id } = header;

    if (id) {
      const client = await this.prisma.client.findUnique({
        where: { id },
      });

      return client;
    }

    return {};
  }
}
