import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { json } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(helmet());
  app.use(json({ limit: "20mb" }));
  app.use(cookieParser());
  const configuredOrigins = process.env.WEB_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];
  const localDevOrigins = ["http://localhost:1001", "http://127.0.0.1:1001"];

  app.enableCors({
    origin: configuredOrigins.length > 0 ? [...new Set([...configuredOrigins, ...localDevOrigins])] : true,
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 1002;
  // "0.0.0.0" (not the default 127.0.0.1) so devices on the same LAN
  // (e.g. a phone testing the Capacitor app) can reach this dev server.
  await app.listen(port, "0.0.0.0");
}

bootstrap();
