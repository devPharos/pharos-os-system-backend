import { Controller, Post } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
// import { PrismaService } from 'src/prisma/prisma.service'
// import { z } from 'zod'

// const authenticateUserBodySchema = z.object({
//   email: z.string().email(),
//   password: z.string(),
// })

// type AuthenticateUserBodySchema = z.infer<typeof authenticateUserBodySchema>

@Controller('/sessions')
export class AuthenticateUserController {
  constructor(
    // private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  @Post()
  async handle() {
    const token = this.jwt.signAsync({
      sub: 'user-id',
    })

    return token
  }
}
