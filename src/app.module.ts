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
import { CreateClientController } from './controllers/create/create-client.controller'
import { CreateFileController } from './controllers/create/create-file.controller'
import { CreateProjectExpensesController } from './controllers/create/create-project-expenses.controller'
import { CreateProjectServiceController } from './controllers/create/create-project-service.controller'
import { CreateServiceOrderDetailsController } from './controllers/create/create-service-order-details.controller'
import { CreateServiceOrderExpensesController } from './controllers/create/create-service-order-expenses.controller'
import { CreateServiceOrderController } from './controllers/create/create-service-order.controller'
import { LogOutUserController } from './controllers/auth/logout.controller'

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
    CreateClientController,
    CreateCollaboratorController,
    CreateFileController,
    CreateProjectExpensesController,
    CreateProjectServiceController,
    CreateProjectController,
    CreateServiceOrderDetailsController,
    CreateServiceOrderExpensesController,
    CreateServiceOrderController,
    CreateUserController,
    LogOutUserController,
    UpdateCollaboratorController,
  ],
  providers: [PrismaService],
})
export class AppModule {}
