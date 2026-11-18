import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { UserRole, ApiResponse } from '@ai-video-studio/shared-types';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER) // allow USER during local dev testing
  async getStats(): Promise<ApiResponse> {
    const stats = await this.adminService.getSystemStats();
    return {
      success: true,
      data: stats,
    };
  }
}

