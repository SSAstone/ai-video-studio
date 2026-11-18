import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service';
import { mediaAssets } from '../database/schema';
import { MediaType, MediaStatus, MediaMetadata, MediaAssetDto } from '@ai-video-studio/shared-types';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly memoryAssets = new Map<string, any>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService
  ) {
    const ffmpegPath = this.configService.get<string>('FFMPEG_PATH') || 'ffmpeg';
    const ffprobePath = this.configService.get<string>('FFPROBE_PATH') || 'ffprobe';
    try {
      ffmpeg.setFfmpegPath(ffmpegPath);
      ffmpeg.setFfprobePath(ffprobePath);
    } catch (err: any) {
      this.logger.warn(`Could not set FFmpeg path: ${err.message}`);
    }
  }

  determineMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    if (mimeType.startsWith('audio/')) return MediaType.AUDIO;
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    throw new BadRequestException(`Unsupported media type: ${mimeType}`);
  }

  async processUpload(
    workspaceId: string,
    file: Express.Multer.File,
    folderId?: string
  ): Promise<MediaAssetDto> {
    const type = this.determineMediaType(file.mimetype);
    const mediaId = uuidv4();
    const ext = path.extname(file.originalname);
    const storageKey = `uploads/${workspaceId}/${mediaId}${ext}`;

    // 1. Save file stream / buffer to storage
    const storedFile = await this.storageService.upload(storageKey, file.buffer, {
      mimeType: file.mimetype,
    });

    const assetRecord: any = {
      id: mediaId,
      workspaceId,
      folderId: folderId || null,
      name: path.parse(file.originalname).name,
      originalFilename: file.originalname,
      type,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storageKey,
      url: storedFile.url,
      thumbnailUrl: null,
      status: MediaStatus.PROCESSING,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.databaseService.isHealthy) {
      await this.databaseService.db.insert(mediaAssets).values(assetRecord);
    } else {
      this.memoryAssets.set(mediaId, assetRecord);
    }

    // 2. Extract metadata & generate thumbnails asynchronously
    this.extractMetadataAndThumbnails(mediaId, storedFile.path, type).catch((err) => {
      this.logger.error(`Failed to process media ${mediaId}: ${err.message}`);
    });

    return assetRecord;
  }

  private async extractMetadataAndThumbnails(
    mediaId: string,
    filePath: string,
    type: MediaType
  ) {
    let metadata: MediaMetadata = {};
    let thumbnailUrl: string | null = null;

    if (type === MediaType.VIDEO || type === MediaType.AUDIO) {
      try {
        metadata = await new Promise<MediaMetadata>((resolve, reject) => {
          ffmpeg.ffprobe(filePath, (err, data) => {
            if (err) {
              return resolve({
                duration: 10, // fallback
                width: 1920,
                height: 1080,
                fps: 30,
              });
            }

            const videoStream = data.streams.find((s) => s.codec_type === 'video');
            const audioStream = data.streams.find((s) => s.codec_type === 'audio');

            const dur = data.format.duration ? parseFloat(String(data.format.duration)) : 10;
            const w = videoStream?.width || 1920;
            const h = videoStream?.height || 1080;
            const fpsStr = videoStream?.r_frame_rate || '30/1';
            const [num, den] = fpsStr.split('/').map(Number);
            const fps = den ? Math.round(num / den) : 30;

            resolve({
              duration: dur,
              width: w,
              height: h,
              fps,
              codec: videoStream?.codec_name,
              audioCodec: audioStream?.codec_name,
              sampleRate: audioStream?.sample_rate ? parseInt(String(audioStream.sample_rate), 10) : 44100,
              channels: audioStream?.channels || 2,
              bitrate: data.format.bit_rate ? parseInt(String(data.format.bit_rate), 10) : undefined,
            });
          });
        });
      } catch (err: any) {
        this.logger.warn(`Probe failed, using fallback metadata: ${err.message}`);
        metadata = { duration: 15, width: 1920, height: 1080, fps: 30 };
      }
    } else if (type === MediaType.IMAGE) {
      metadata = { width: 1920, height: 1080, duration: 5 };
    }

    // Generate video thumbnail if video
    if (type === MediaType.VIDEO) {
      try {
        const thumbKey = `thumbnails/${mediaId}.jpg`;
        const thumbLocalPath = this.storageService.getLocalPath(thumbKey);
        const thumbDir = path.dirname(thumbLocalPath);
        if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

        await new Promise<void>((resolve, reject) => {
          ffmpeg(filePath)
            .screenshots({
              timestamps: ['1'],
              filename: path.basename(thumbLocalPath),
              folder: thumbDir,
              size: '640x360',
            })
            .on('end', () => resolve())
            .on('error', (err) => resolve()); // don't fail entire asset if thumbnail generation times out
        });

        if (fs.existsSync(thumbLocalPath)) {
          thumbnailUrl = `/storage/${thumbKey}`;
        }
      } catch (err: any) {
        this.logger.warn(`Could not generate thumbnail: ${err.message}`);
      }
    } else if (type === MediaType.IMAGE) {
      thumbnailUrl = `/storage/${path.relative(this.storageService.getLocalPath(''), filePath).replace(/\\/g, '/')}`;
    }

    // Generate dummy waveform peaks (0.1 to 1.0) for visual timeline rendering
    if (type === MediaType.VIDEO || type === MediaType.AUDIO) {
      const peaks: number[] = [];
      const numBars = 50;
      for (let i = 0; i < numBars; i++) {
        peaks.push(parseFloat((Math.sin(i * 0.4) * 0.4 + 0.5 + Math.random() * 0.2).toFixed(2)));
      }
      metadata.waveformPeaks = peaks;
    }

    // Update DB record
    if (this.databaseService.isHealthy) {
      await this.databaseService.db
        .update(mediaAssets)
        .set({
          status: MediaStatus.READY,
          metadata: metadata as any,
          thumbnailUrl,
          updatedAt: new Date(),
        })
        .where(eq(mediaAssets.id, mediaId));
    } else {
      const existing = this.memoryAssets.get(mediaId);
      if (existing) {
        existing.status = MediaStatus.READY;
        existing.metadata = metadata;
        existing.thumbnailUrl = thumbnailUrl;
        this.memoryAssets.set(mediaId, existing);
      }
    }
  }

  async getWorkspaceMedia(workspaceId: string, type?: MediaType) {
    if (this.databaseService.isHealthy) {
      return this.databaseService.db
        .select()
        .from(mediaAssets)
        .where(
          type
            ? and(eq(mediaAssets.workspaceId, workspaceId), eq(mediaAssets.type, type))
            : eq(mediaAssets.workspaceId, workspaceId)
        )
        .orderBy(desc(mediaAssets.createdAt));
    }

    return Array.from(this.memoryAssets.values()).filter((m) => {
      if (m.workspaceId !== workspaceId) return false;
      if (type && m.type !== type) return false;
      return true;
    });
  }

  async getMediaById(id: string) {
    if (this.databaseService.isHealthy) {
      const [asset] = await this.databaseService.db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, id))
        .limit(1);

      if (!asset) throw new NotFoundException('Media asset not found');
      return asset;
    }

    const asset = this.memoryAssets.get(id);
    if (!asset) throw new NotFoundException('Media asset not found');
    return asset;
  }

  async deleteMedia(id: string) {
    const asset = await this.getMediaById(id);
    await this.storageService.delete(asset.storageKey);
    if (asset.thumbnailUrl) {
      const thumbKey = asset.thumbnailUrl.replace('/storage/', '');
      await this.storageService.delete(thumbKey);
    }

    if (this.databaseService.isHealthy) {
      await this.databaseService.db.delete(mediaAssets).where(eq(mediaAssets.id, id));
    } else {
      this.memoryAssets.delete(id);
    }

    return { success: true };
  }
}

