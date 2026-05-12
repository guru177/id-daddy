import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { removeBackground } from '@imgly/background-removal-node';
import { Blob } from 'buffer';

@Processor('bg-removal')
export class BgRemovalProcessor extends WorkerHost {
  async process(job: Job<{ imageBase64: string; bgColor: string }>): Promise<string> {
    const { imageBase64 } = job.data;
    
    try {
      // Extract base64 payload
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Convert to blob for imgly processing
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      
      const resultBlob = await removeBackground(blob as any, {
        model: 'small',
        output: { format: 'image/png' }, // must be png to preserve transparency
      } as any);
      
      const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());
        
      return `data:image/png;base64,${resultBuffer.toString('base64')}`;
    } catch (err) {
      console.error('BG Removal Worker failed:', err);
      throw err;
    }
  }
}
