import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';
import { ApiResponse } from '@ai-video-studio/shared-types';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async getMyWorkspaces(@CurrentUser() user: any): Promise<ApiResponse> {
    const list = await this.workspacesService.getUserWorkspaces(user.id);
    return {
      success: true,
      data: list,
    };
  }

  @Post()
  async createWorkspace(
    @CurrentUser() user: any,
    @Body('name') name: string
  ): Promise<ApiResponse> {
    const ws = await this.workspacesService.createWorkspace(user.id, name);
    return {
      success: true,
      data: ws,
      message: 'Workspace created successfully',
    };
  }

  @Get(':id')
  async getWorkspace(@Param('id') id: string): Promise<ApiResponse> {
    const ws = await this.workspacesService.getWorkspaceById(id);
    return {
      success: true,
      data: ws,
    };
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string): Promise<ApiResponse> {
    const members = await this.workspacesService.getWorkspaceMembers(id);
    return {
      success: true,
      data: members,
    };
  }
}

