import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BgRemovalController } from './bg-removal.controller';
import { BgRemovalService } from './bg-removal.service';
import { BgRemovalProcessor } from './bg-removal.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'bg-removal',
    }),
  ],
  controllers: [BgRemovalController],
  providers: [BgRemovalService, BgRemovalProcessor],
  exports: [BgRemovalService],
})
export class BgRemovalModule {}
