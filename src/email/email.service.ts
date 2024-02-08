import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: "comunicacao@pharosit.com.br",
        pass: "5ej@#EYYccJrg@",
      },
    });

    this.transporter.verify(function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });
  }

  async send(to: string, subject: string, html: string) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: "PharosIT <comunicacao@pharosit.com.br>",
      to,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      return info.response;
    } catch (error) {
      console.error("Erro ao enviar email: ", error);
      throw error;
    }
  }
}
