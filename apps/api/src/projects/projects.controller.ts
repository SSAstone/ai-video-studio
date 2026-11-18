import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProjectsService, CreateProjectDto } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';
import { Timeline } from '@ai-video-studio/video-schema';
import { ApiResponse } from '@ai-video-studio/shared-types';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects(@Query('workspaceId') workspaceId: string): Promise<ApiResponse> {
    const list = await this.projectsService.getWorkspaceProjects(workspaceId);
    return {
      success: true,
      data: list,
    };
  }

  @Post()
  async createProject(
    @CurrentUser() user: any,
    @Body() dto: CreateProjectDto
  ): Promise<ApiResponse> {
    const project = await this.projectsService.createProject(user.id, dto);
    return {
      success: true,
      data: project,
      message: 'Project created successfully',
    };
  }

  @Get(':id')
  async getProject(@Param('id') id: string): Promise<ApiResponse> {
    const project = await this.projectsService.getProjectById(id);
    return {
      success: true,
      data: project,
    };
  }

  @Put(':id/timeline')
  async updateTimeline(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { timeline: Timeline; changeSummary?: string }
  ): Promise<ApiResponse> {
    const result = await this.projectsService.updateTimeline(
      id,
      body.timeline,
      user.id,
      body.changeSummary
    );
    return {
      success: true,
      data: result,
      message: 'Timeline saved successfully',
    };
  }

  @Patch(':id')
  async updateMetadata(
    @Param('id') id: string,
    @Body() updates: { name?: string; description?: string; aspectRatio?: string }
  ): Promise<ApiResponse> {
    const updated = await this.projectsService.updateProjectMeta(id, updates);
    return {
      success: true,
      data: updated,
      message: 'Project updated',
    };
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: string): Promise<ApiResponse> {
    await this.projectsService.deleteProject(id);
    return {
      success: true,
      message: 'Project deleted',
    };
  }

  @Post(':id/duplicate')
  async duplicateProject(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<ApiResponse> {
    const duplicated = await this.projectsService.duplicateProject(id, user.id);
    return {
      success: true,
      data: duplicated,
      message: 'Project duplicated successfully',
    };
  }

  @Get(':id/versions')
  async getVersions(@Param('id') id: string): Promise<ApiResponse> {
    const versions = await this.projectsService.getProjectVersions(id);
    return {
      success: true,
      data: versions,
    };
  }
}

