import { Controller, Get } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { ApiResponse } from '@ai-video-studio/shared-types';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async getTemplates(): Promise<ApiResponse> {
    const list = await this.templatesService.getTemplates();
    return {
      success: true,
      data: list,
    };
  }
}

