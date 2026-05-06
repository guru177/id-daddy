import "reflect-metadata";
import compression from "compression";
import express from "express";
import helmet from "helmet";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  const config = app.get(ConfigService);

  app.use("/billing/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression());
  app.enableCors({
    origin: allowedOrigins(config),
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("ID Daddy SaaS API")
    .setDescription("Multi-tenant ID card generator API")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("/docs", app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.get<number>("API_PORT", 4000);
  await app.listen(port);
}

void bootstrap();

function allowedOrigins(config: ConfigService) {
  const configured = [
    config.get<string>("WEB_ADMIN_URL", "http://localhost:5173"),
    config.get<string>("DESKTOP_APP_URL", "http://localhost:5174")
  ].flatMap((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean));

  if (config.get<string>("NODE_ENV") === "production") {
    return configured;
  }

  return Array.from(
    new Set([
      ...configured,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5175"
    ])
  );
}
