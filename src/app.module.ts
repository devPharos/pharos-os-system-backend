import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { ConfigModule } from "@nestjs/config";
import { envSchema } from "./env";
import { AuthModule } from "./auth/auth.module";
import { AuthenticateUserController } from "./controllers/auth/authenticate.controller";
import { CreateCollaboratorController } from "./controllers/create/create-collaborator.controller";
import { CreateProjectController } from "./controllers/create/create-project.controller";
import { CreateUserController } from "./controllers/create/create-user.controller";
import { UpdateCollaboratorController } from "./controllers/update/update-collaborator.controller";
import { CreateClientController } from "./controllers/create/create-client.controller";
import { CreateProjectExpensesController } from "./controllers/create/create-project-expenses.controller";
import { CreateProjectServiceController } from "./controllers/create/create-project-service.controller";
import { CreateServiceOrderDetailsController } from "./controllers/create/create-service-order-details.controller";
import { CreateServiceOrderExpensesController } from "./controllers/create/create-service-order-expenses.controller";
import { CreateServiceOrderController } from "./controllers/create/create-service-order.controller";
import { LogOutUserController } from "./controllers/auth/logout.controller";
import { ListClientsController } from "./controllers/list/list-client.controller";
import { GetCurrentUserDataController } from "./controllers/get/get-user-data.controller";
import { GetProjectsDataController } from "./controllers/get/get-projects-data.controller";
import { GetProjectServicesController } from "./controllers/get/get-project-services.controller";
import { GetProjectExpensesController } from "./controllers/get/get-project-expenses-data.controller";
import { ListServiceOrdersController } from "./controllers/list/list-service-orders.controller";
import { GetServiceOrderDataController } from "./controllers/get/get-service-order.controller";
import { ListCompaniesController } from "./controllers/list/list-companies.controller";
import { GetClientDataController } from "./controllers/get/get-client.controller";
import { EditProfileController } from "./controllers/edit-profile.controller";
import { GetCollaboratorProfileController } from "./controllers/get/get-collaborator.controller";
import { GetCollaboratorsController } from "./controllers/get/get-no-access-collaborators.controller";
import { GetCollaboratorsDataController } from "./controllers/get/get-collaborators-data.controller";
import { ListCollaboratorsController } from "./controllers/list/list-collaborators.controller";
import { GetUserDataController } from "./controllers/get/get-current-user-data.controller";
import { CreateClientUserController } from "./controllers/create/create-client-user.controller";
import { CreateSupportTicketController } from "./controllers/create/create-support-ticket.controller";
import { ListSupportTicketsController } from "./controllers/list/list-support-tickets.controller";
import { ListSupportTicketsMessagesController } from "./controllers/list/list-ticket-messages.controller";
import { CreateTicketMessageController } from "./controllers/create/create-ticket-messsage.controller";

import { PdfModule } from "./pdf/pdf.module";
import { FindProjectController } from "./controllers/find/find-project.controller";
import { UpdateProjectController } from "./controllers/update/update-project.controller";
import { DeleteExpenseController } from "./controllers/delete/delete-project-expense.controller";
import { DeleteServiceController } from "./controllers/delete/delete-project-service.controller";
import { UpdateClientStatusController } from "./controllers/update/update-client-status.controller";
import { UpdateClientController } from "./controllers/update/update-client.controller";
import { UpdateUserController } from "./controllers/update/update-user.controller";
import { FindUserController } from "./controllers/find/find-user.controller";
import { ListSupervisorsController } from "./controllers/list/list-supervisors.controller";
import { FindCollaboratorController } from "./controllers/find/find-collaborator.controller";
import { ListServiceOrdersFiltersController } from "./controllers/list/list-service-order-filters.controller";
import { DeleteServiceOrderController } from "./controllers/delete/delete-service-order.controller";
import { UpdateServiceStatusOrderController } from "./controllers/update/update-service-order-status.controller";
import { FindServiceOrderController } from "./controllers/find/find-service-order.controller";
import { DeleteOSExpenseController } from "./controllers/delete/delete-service-order-expense.controller";
import { UpdateServiceOrderController } from "./controllers/update/update-service-order.controller";
import { ListProjectsController } from "./controllers/list/list-projects.controller";
import { ListProjectCollaboratorsController } from "./controllers/list/list-project-collaborators.controller";
import { UpdateSupportTicketController } from "./controllers/update/update-ticket-info.controller";
import { ListHomeDataController } from "./controllers/list/list-home-data.controller";
import { ListClosingController } from "./controllers/list/list-closing.controller";
import { UpdateClosingStatusController } from "./controllers/update/update-closing-status.controller";
import { StorageModule } from "./storage/storage.module";
import { EmailModule } from "./email/email.module";
import { UpdateProjectStatusController } from "./controllers/update/update-project-status";
import { ProjectHoursModule } from "./project-hours/project-hours.module";
import { UpdateClientPaymentDateStatusController } from "./controllers/update/update-client-payment-date.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
    PdfModule,
    StorageModule,
    EmailModule,
    ProjectHoursModule,
  ],
  controllers: [
    UpdateClientPaymentDateStatusController,
    UpdateProjectStatusController,
    UpdateClosingStatusController,
    AuthenticateUserController,
    CreateClientController,
    CreateCollaboratorController,
    CreateProjectExpensesController,
    CreateProjectServiceController,
    CreateProjectController,
    CreateServiceOrderDetailsController,
    CreateServiceOrderExpensesController,
    CreateServiceOrderController,
    EditProfileController,
    CreateTicketMessageController,
    ListClosingController,
    GetServiceOrderDataController,
    CreateSupportTicketController,
    GetClientDataController,
    ListSupportTicketsController,
    ListSupportTicketsMessagesController,
    GetCollaboratorProfileController,
    GetCollaboratorsController,
    GetCollaboratorsDataController,
    CreateUserController,
    GetCurrentUserDataController,
    GetProjectsDataController,
    GetProjectExpensesController,
    GetProjectServicesController,
    GetUserDataController,
    ListCollaboratorsController,
    CreateClientUserController,
    FindProjectController,
    ListClientsController,
    UpdateProjectController,
    ListCompaniesController,
    ListServiceOrdersController,
    DeleteExpenseController,
    LogOutUserController,
    DeleteServiceController,
    UpdateClientController,
    UpdateCollaboratorController,
    UpdateClientStatusController,
    UpdateUserController,
    FindUserController,
    ListSupervisorsController,
    FindCollaboratorController,
    ListServiceOrdersFiltersController,
    DeleteServiceOrderController,
    UpdateServiceStatusOrderController,
    FindServiceOrderController,
    DeleteOSExpenseController,
    UpdateServiceOrderController,
    ListProjectsController,
    ListProjectCollaboratorsController,
    UpdateSupportTicketController,
    ListHomeDataController,
  ],
  providers: [PrismaService],
})
export class AppModule {}
