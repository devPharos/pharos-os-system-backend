import { Injectable } from "@nestjs/common";
import * as schedule from "node-schedule";
import { EmailService } from "./email.service";
import { PrismaService } from "src/prisma/prisma.service";
import { getDate, getMonth, getYear } from "date-fns";

@Injectable()
export class EmailSchedulerService {
  constructor(
    private readonly emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  async scheduleEmailSending() {
    const clients = await this.prisma.client.findMany({
      where: {
        active: true,
      },
      select: {
        fantasyName: true,
        paymentDate: true,
      },
    });

    const today = getDate(new Date());

    const filteredClients = clients.filter(
      (client) =>
        client.paymentDate && parseInt(client.paymentDate) - 1 === today,
    );

    const collaborators = await this.prisma.collaborator.findMany();

    collaborators.forEach(async (collaborator) => {
      if (collaborator.userId) {
        const user = await this.prisma.user.findUnique({
          where: {
            id: collaborator.userId,
          },
          select: {
            email: true,
          },
        });

        const scheduledDate = new Date(
          getYear(new Date()),
          getMonth(new Date()),
          today,
          8,
          0,
          0,
        );

        const clientsNames = filteredClients
          .map((client) => {
            return client.fantasyName;
          })
          .join(",");

        if (user) {
          schedule.scheduleJob(scheduledDate, async () => {
            try {
              await this.emailService.send(
                user?.email,
                "Data limite de lançamento das OS",
                `
                 <table style="margin: 0 auto; width: 100%;">
                   <tr>
                     <td align="center" valign="top" style="padding-bottom:24px;">
                       <div style="margin-bottom:24px;">
                        <h1 style="color:#FFCE00;margin-bottom:8px;">Olá, ${collaborator.name}!</h1>
                        <p style="font-size:16px;color:#1e1e1e;font-weight:500;text-align:left">
                          Este é um aviso para informar que as OS’s dos clientes ${clientsNames} devem ser inseridas no nosso sistema até hoje para faturamento.
                        </p>
                       </div>

                       <div style="margin-bottom:16px;">
                        <p style="font-size:16px;color:#1e1e1e;text-align:left">
                          Caso tenha prestado atendimentos nesse mês, favor inserir todas as OS’s ainda hoje. Se por algum motivo não conseguir lançar todas, favor informar ao setor de faturamento.
                        </p>
                       </div>

                      <div style="margin-bottom:16px;">
                        <p style="font-size:16px;color:#1e1e1e;text-align:left">
                          OS’s não lançadas dentro do prazo não aparecerão no relatório de detalhamento para o cliente e, portanto, não poderão ser faturadas no mês correto.
                        </p>
                      </div>

                      <div style="margin-bottom:16px;">
                        <p style="font-size:16px;color:#1e1e1e;text-align:left">
                          Nesse caso, serão faturadas no mês seguinte, bem como o pagamento ao consultor.
                        </p>
                      </div>

                       <div style="margin-bottom: 24px;">
                         <p style="font-size:16px; margin: 0;">Que tal ir lançar agora?</p>
                       </div>

                       <div style="background-color:#FFCE00;padding:16px 24px;border-radius:16px;width:150px;text-align:left">
                         <a href="https://app.pharosit.com.br/service-orders/create" style="font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Acessar sistema</a>
                       </div>

                       <div style="margin-top:16px;">
                        <p style="font-size:14px;color:#4d4d4d;font-weight:bold;text-align:left">
                          Favor não responder, este é um e-mail gerado automaticamente e não será lido ou respondido.
                        </p>
                       </div>
                     </td>
                   </tr>
                 </table>
              `,
              );
            } catch (error) {
              console.error("Erro ao enviar email:", error);
            }
          });
        }
      }
    });
  }
}
