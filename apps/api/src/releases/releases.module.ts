import { Module } from "@nestjs/common";
import { ReleasesController } from "./releases.controller";
import { ReleasesService } from "./releases.service";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [ReleasesController],
  providers: [ReleasesService]
})
export class ReleasesModule {}
