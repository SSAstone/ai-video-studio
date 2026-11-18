import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';
import { AiEditPlan } from '@ai-video-studio/video-schema';
import { ApiResponse } from '@ai-video-studio/shared-types';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('projects/:projectId/plan')
  async generatePlan(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
    @Body('prompt') prompt: string
  ): Promise<ApiResponse> {
    const plan = await this.aiService.generateEditPlan(projectId, user.id, prompt);
    return {
      success: true,
      data: plan,
      message: 'AI editing plan generated',
    };
  }

  @Post('projects/:projectId/apply')
  async applyPlan(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
    @Body() plan: AiEditPlan
  ): Promise<ApiResponse> {
    const result = await this.aiService.applyEditPlan(projectId, user.id, plan);
    return {
      success: true,
      data: result,
      message: 'AI plan applied successfully to timeline',
    };
  }
}

