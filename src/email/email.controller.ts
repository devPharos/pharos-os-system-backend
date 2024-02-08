import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { EmailService } from "./email.service";
import { z } from "zod";
import { CurrentUser } from "src/auth/current-user.decorator";
import { UserPayload } from "src/auth/jwt.strategy";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { differenceInHours } from "date-fns";

const emailBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type EmailBodySchema = z.infer<typeof emailBodySchema>;

const closingUser = z.object({
  name: z.string(),
  lastName: z.string(),
  value: z.string(),
  userId: z.string().nullable(),
});

const closingClient = z.object({
  fantasyName: z.string(),
});

const closingServiceOrderExpenses = z.object({
  value: z.string(),
});

const closingServiceOrders = z.object({
  date: z.coerce.date(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  client: closingClient,
  collaborator: closingUser,
  serviceOrderExpenses: z.array(closingServiceOrderExpenses),
});

const closingEmailBodySchema = z.object({
  user: closingUser,
  serviceOrders: z.array(closingServiceOrders),
});

type ClosingEmailBodySchema = z.infer<typeof closingEmailBodySchema>;

@Controller("mail")
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(
    private readonly sendgridService: EmailService,
    private prisma: PrismaService,
  ) {}

  @Post("user-created")
  async sendUserEmail(
    @Body() body: EmailBodySchema,
    @CurrentUser() currentUser: UserPayload,
  ) {
    const { email, password } = body;

    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: currentUser.sub,
      },
    });

    const client = await this.prisma.client.findUnique({
      where: {
        userId: currentUser.sub,
      },
    });

    const mail = {
      to: email,
      subject: "Conta de acesso criada",
      html: `
      <table style="margin: 0 auto; width: 100%;">
        <tr>
          <td align="center" valign="top" style="padding-bottom:24px;">
            <div style="margin-bottom:24px;">
              <h1 style="color:#FFCE00; margin-bottom:8px;">Olá, ${
                collaborator ? collaborator.name : client?.fantasyName
              }!</h1>
              <span style="font-size:14px;color:#4D4D4D;font-weight:500;">Sua conta no sistema da PharosIT foi criada com sucesso</span>
            </div>

            <div style="margin-bottom: 24px;">
              <p style="font-size:16px; margin: 0;">Para acessá-la use as credenciais:</p>
              <span style="font-weight:bold;font-size:16px;margin-right:8px;text-decoration:none;">Email: ${email}</span>
              <span style="font-weight:bold;font-size:16px;">Senha: ${password}</span>
            </div>

            <div style="background-color:#FFCE00;padding:16px 24px;border-radius:16px;width:150px;">
              <a href="https://app.pharosit.com.br/login" style="font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Acessar conta</a>
            </div>
          </td>
        </tr>
      </table>
      `,
    };

    return await this.sendgridService.send(mail.to, mail.subject, mail.html);
  }

  @Post("monthly-closing")
  async sendClosingEmail(
    @Body() body: ClosingEmailBodySchema,
    @CurrentUser() currentUser: UserPayload,
  ) {
    const { user, serviceOrders } = body;

    const crrUser = await this.prisma.user.findUnique({
      where: {
        id: currentUser.sub,
      },
    });

    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        userId: user.userId || "",
      },
    });

    let totalHours = 0;
    let totalExpenses = 0;
    let totalValue = 0;

    serviceOrders &&
      serviceOrders.forEach((os) => {
        totalHours += differenceInHours(
          new Date(os.endDate),
          new Date(os.startDate),
        );

        os.serviceOrderExpenses.forEach((exp) => {
          totalExpenses += parseInt(exp.value);
        });
      });

    totalValue += parseInt(collaborator?.value || "0") * totalHours;

    const mail = {
      to: crrUser?.email || "",
      subject: "Fechamento do mês",
      html: `
      <table style="margin: 0 auto; width: 100%;">
        <tr>
          <td align="center" valign="top" style="padding-bottom:24px;">
            <div style="margin-bottom:24px;">
              <h1 style="color:#FFCE00; margin-bottom:8px;">Olá, ${collaborator?.name}!</h1>
              <span style="font-size:14px;color:#4D4D4D;font-weight:500;">O fechamento desse mês foi concluído</span>
            </div>

            <div style="margin-bottom: 24px;">
              <p style="font-size:16px; margin: 0;">Seus dados desse mês:</p>
              <span style="font-weight:bold;font-size:16px;margin-right:8px;text-decoration:none;">Horas feitas: ${totalHours}</span>
              <span style="font-weight:bold;font-size:16px;">Valor de reembolso: ${totalExpenses}</span>
              <span style="font-weight:bold;font-size:16px;">Valor total: ${totalValue}</span>
            </div>
          </td>
        </tr>
      </table>
      `,
    };

    return await this.sendgridService.send(mail.to, mail.subject, mail.html);
  }
}
