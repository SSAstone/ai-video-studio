import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaType, ApiResponse } from '@ai-video-studio/shared-types';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max limit
      },
    })
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('workspaceId') workspaceId: string,
    @Query('folderId') folderId?: string
  ): Promise<ApiResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    const asset = await this.mediaService.processUpload(workspaceId, file, folderId);
    return {
      success: true,
      data: asset,
      message: 'Media uploaded successfully and processing queued',
    };
  }

  @Get()
  async getMedia(
    @Query('workspaceId') workspaceId: string,
    @Query('type') type?: MediaType
  ): Promise<ApiResponse> {
    const list = await this.mediaService.getWorkspaceMedia(workspaceId, type);
    return {
      success: true,
      data: list,
    };
  }

  @Get(':id')
  async getMediaById(@Param('id') id: string): Promise<ApiResponse> {
    const asset = await this.mediaService.getMediaById(id);
    return {
      success: true,
      data: asset,
    };
  }

  @Delete(':id')
  async deleteMedia(@Param('id') id: string): Promise<ApiResponse> {
    await this.mediaService.deleteMedia(id);
    return {
      success: true,
      message: 'Media deleted',
    };
  }
}

