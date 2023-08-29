import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './env'
import { AuthModule } from './auth/auth.module'
import { AuthenticateUserController } from './controllers/authenticate.controller'
import { CreateUserController } from './controllers/create-user.controller'
import { CreateCollaboratorController } from './controllers/create-collaborator.controller'
import { UpdateCollaboratorController } from './controllers/update-collaborator.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
  ],
  controllers: [
    AuthenticateUserController,
    CreateCollaboratorController,
    CreateUserController,
    UpdateCollaboratorController,
  ],
  providers: [PrismaService],
})
export class AppModule {}
