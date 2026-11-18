import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { RenderingService } from './rendering.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';
import { RenderOptions, ApiResponse } from '@ai-video-studio/shared-types';

@Controller('render')
@UseGuards(JwtAuthGuard)
export class RenderingController {
  constructor(private readonly renderingService: RenderingService) {}

  @Post('projects/:projectId')
  async queueRender(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
    @Body() body: { workspaceId: string; options: RenderOptions }
  ): Promise<ApiResponse> {
    const job = await this.renderingService.queueRender(
      projectId,
      body.workspaceId,
      user.id,
      body.options
    );
    return {
      success: true,
      data: job,
      message: 'Render job queued successfully',
    };
  }

  @Get('jobs/:jobId')
  async getJobStatus(@Param('jobId') jobId: string): Promise<ApiResponse> {
    const job = await this.renderingService.getJob(jobId);
    return {
      success: true,
      data: job,
    };
  }

  @Post('jobs/:jobId/cancel')
  async cancelJob(@Param('jobId') jobId: string): Promise<ApiResponse> {
    await this.renderingService.cancelJob(jobId);
    return {
      success: true,
      message: 'Render job cancelled',
    };
  }

  @Get('projects/:projectId/jobs')
  async getProjectJobs(@Param('projectId') projectId: string): Promise<ApiResponse> {
    const jobs = await this.renderingService.getProjectJobs(projectId);
    return {
      success: true,
      data: jobs,
    };
  }
}

