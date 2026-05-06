import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { ExportsController } from "./exports.controller";
import { ExportsService } from "./exports.service";

@Module({
  imports: [StorageModule],
  controllers: [ExportsController],
  providers: [ExportsService]
})
export class ExportsModule {}
