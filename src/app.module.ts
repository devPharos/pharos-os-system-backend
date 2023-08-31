import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './env'
import { AuthModule } from './auth/auth.module'
import { AuthenticateUserController } from './controllers/auth/authenticate.controller'
import { CreateCollaboratorController } from './controllers/create/create-collaborator.controller'
import { CreateProjectController } from './controllers/create/create-project.controller'
import { CreateUserController } from './controllers/create/create-user.controller'
import { UpdateCollaboratorController } from './controllers/update/update-collaborator.controller'

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
    CreateProjectController,
    CreateUserController,
    UpdateCollaboratorController,
  ],
  providers: [PrismaService],
})
export class AppModule {}
