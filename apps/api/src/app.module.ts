import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { BillingModule } from "./billing/billing.module";
import { ExportsModule } from "./exports/exports.module";
import { FilesModule } from "./files/files.module";
import { BgRemovalModule } from "./bg-removal/bg-removal.module";
import { GenerationModule } from "./generation/generation.module";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { RecordsModule } from "./records/records.module";
import { StorageModule } from "./storage/storage.module";
import { TemplatesModule } from "./templates/templates.module";
import { UsersModule } from "./users/users.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";
import { AIModule } from "./ai/ai.module";
import { ReleasesModule } from "./releases/releases.module";
import { FoldersModule } from "./folders/folders.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"]
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>("REDIS_HOST", "localhost"),
          port: config.get<number>("REDIS_PORT", 6379),
          password: config.get<string>("REDIS_PASSWORD") || undefined,
          maxRetriesPerRequest: null
        }
      })
    }),
    PrismaModule,
    StorageModule,
    AuthModule,
    WorkspacesModule,
    UsersModule,
    TemplatesModule,
    RecordsModule,
    FilesModule,
    GenerationModule,
    BgRemovalModule,
    ExportsModule,
    BillingModule,
    AIModule,
    ReleasesModule,
    FoldersModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
