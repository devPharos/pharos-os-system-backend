import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import * as cors from "cors";
import { Env } from "./env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService<Env, true>>(ConfigService);
  const port = configService.get("PORT");

  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "https://pharos-os-system.netlify.app",
        "https://app.pharosit.com.br",
      ], // Replace with your frontend's URL
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true, // This option is important for handling cookies and authentication headers
    }),
  );

  await app.listen(port);
}
bootstrap();
