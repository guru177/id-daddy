import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BgRemovalService } from './bg-removal.service';
import { Public } from '../common/public.decorator';

@Controller('bg-removal')
export class BgRemovalController {
  constructor(private readonly bgRemovalService: BgRemovalService) {}

  @Public()
  @Post()
  async processImage(@Body() dto: { imageBase64: string; bgColor: string }) {
    const job = await this.bgRemovalService.enqueueBgRemoval(dto.imageBase64, dto.bgColor);
    return { jobId: job.id };
  }

  @Public()
  @Get(':id')
  async getJobStatus(@Param('id') id: string) {
    const job = await this.bgRemovalService.getJobStatus(id);
    if (!job) {
      return { status: 'not_found' };
    }
    const state = await job.getState();
    return {
      id: job.id,
      status: state,
      result: state === 'completed' ? job.returnvalue : null,
      failedReason: job.failedReason,
    };
  }
}
