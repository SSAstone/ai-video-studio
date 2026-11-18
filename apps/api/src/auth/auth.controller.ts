import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto, ApiResponse } from '@ai-video-studio/shared-types';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/auth.decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<ApiResponse> {
    const session = await this.authService.register(dto);
    return {
      success: true,
      data: session,
      message: 'Account created successfully',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<ApiResponse> {
    const session = await this.authService.login(dto);
    return {
      success: true,
      data: session,
      message: 'Logged in successfully',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto): Promise<ApiResponse> {
    const session = await this.authService.refreshToken(dto.refreshToken);
    return {
      success: true,
      data: session,
      message: 'Token refreshed successfully',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any): Promise<ApiResponse> {
    return {
      success: true,
      data: user,
    };
  }
}

