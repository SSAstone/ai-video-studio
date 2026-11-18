import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider, StorageFile } from '@ai-video-studio/shared-types';
import { LocalStorageProvider } from './local-storage.provider';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements StorageProvider {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: StorageProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly localProvider: LocalStorageProvider
  ) {
    const driver = this.configService.get<string>('STORAGE_DRIVER') || 'local';
    if (driver === 'local') {
      this.provider = this.localProvider;
    } else {
      // Future cloud drivers (S3, R2, GCS) can be injected cleanly here
      this.provider = this.localProvider;
    }
    this.logger.log(`Initialized StorageService with driver: ${driver}`);
  }

  upload(key: string, data: Buffer | Readable, options?: { mimeType?: string; isPublic?: boolean }): Promise<StorageFile> {
    return this.provider.upload(key, data, options);
  }

  getStream(key: string): Promise<Readable> {
    return this.provider.getStream(key);
  }

  getBuffer(key: string): Promise<Buffer> {
    return this.provider.getBuffer(key);
  }

  getUrl(key: string): Promise<string> {
    return this.provider.getUrl(key);
  }

  delete(key: string): Promise<boolean> {
    return this.provider.delete(key);
  }

  exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  getLocalPath(key: string): string {
    return this.provider.getLocalPath(key);
  }
}

