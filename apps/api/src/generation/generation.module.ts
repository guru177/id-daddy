import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { GENERATION_QUEUE } from "./generation.constants";
import { GenerationController } from "./generation.controller";
import { GenerationProcessor } from "./generation.processor";
import { GenerationService } from "./generation.service";
import { PdfRendererService } from "./pdf-renderer.service";

@Module({
  imports: [BullModule.registerQueue({ name: GENERATION_QUEUE }), StorageModule],
  controllers: [GenerationController],
  providers: [GenerationService, GenerationProcessor, PdfRendererService],
  exports: [GenerationService]
})
export class GenerationModule {}
