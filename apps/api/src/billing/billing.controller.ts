import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '@ai-video-studio/shared-types';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  async getPlans(): Promise<ApiResponse> {
    const plans = await this.billingService.getPlans();
    return {
      success: true,
      data: plans,
    };
  }

  @Get('workspaces/:workspaceId/credits')
  async getCredits(@Param('workspaceId') workspaceId: string): Promise<ApiResponse> {
    const balance = await this.billingService.getCreditBalance(workspaceId);
    return {
      success: true,
      data: { balance },
    };
  }

  @Post('workspaces/:workspaceId/topup')
  async topupCredits(
    @Param('workspaceId') workspaceId: string,
    @Body('amount') amount: number
  ): Promise<ApiResponse> {
    const newBalance = await this.billingService.addCredits(
      workspaceId,
      amount || 100,
      'Manual top-up'
    );
    return {
      success: true,
      data: { balance: newBalance },
      message: `${amount || 100} credits added successfully`,
    };
  }
}

