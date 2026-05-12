import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class BgRemovalService {
  constructor(@InjectQueue('bg-removal') private bgRemovalQueue: Queue) {}

  async enqueueBgRemoval(imageBase64: string, bgColor: string) {
    return this.bgRemovalQueue.add('remove-bg', { imageBase64, bgColor }, {
      removeOnComplete: { age: 120 }, // Keep for 2 minutes to allow frontend to retrieve result
      removeOnFail: { age: 120 },
    });
  }

  async getJobStatus(jobId: string) {
    return this.bgRemovalQueue.getJob(jobId);
  }
}
