import { Controller, Post, Body, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('generate-text')
  @ApiOperation({ summary: 'Generate design from text prompt' })
  async generateFromText(@Body('prompt') prompt: string) {
    return this.aiService.generateDesignFromText(prompt);
  }

  @Post('analyze-image')
  @ApiOperation({ summary: 'Analyze image and generate design template' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async analyzeImage(@UploadedFile() file: Express.Multer.File) {
    return this.aiService.analyzeImageAndGenerateDesign(file.buffer, file.mimetype);
  }
}
