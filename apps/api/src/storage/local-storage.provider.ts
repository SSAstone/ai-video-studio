import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider, StorageFile } from '@ai-video-studio/shared-types';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly baseStoragePath: string;

  constructor(private readonly configService: ConfigService) {
    const rawPath = this.configService.get<string>('LOCAL_STORAGE_PATH') || './storage';
    this.baseStoragePath = path.resolve(process.cwd(), rawPath);
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const subDirs = ['uploads', 'thumbnails', 'renders', 'temp'];
    for (const sub of subDirs) {
      const full = path.join(this.baseStoragePath, sub);
      if (!fs.existsSync(full)) {
        fs.mkdirSync(full, { recursive: true });
      }
    }
  }

  getLocalPath(key: string): string {
    return path.join(this.baseStoragePath, key);
  }

  async upload(
    key: string,
    data: Buffer | Readable,
    options?: { mimeType?: string; isPublic?: boolean }
  ): Promise<StorageFile> {
    const targetPath = this.getLocalPath(key);
    const targetDir = path.dirname(targetPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (Buffer.isBuffer(data)) {
      await fs.promises.writeFile(targetPath, data);
    } else {
      const writeStream = fs.createWriteStream(targetPath);
      await pipeline(data, writeStream);
    }

    const stat = await fs.promises.stat(targetPath);
    const mimeType = options?.mimeType || 'application/octet-stream';
    const filename = path.basename(key);
    const url = `/storage/${key.replace(/\\/g, '/')}`;

    return {
      key,
      filename,
      size: stat.size,
      mimeType,
      path: targetPath,
      url,
    };
  }

  async getStream(key: string): Promise<Readable> {
    const filePath = this.getLocalPath(key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found in storage: ${key}`);
    }
    return fs.createReadStream(filePath);
  }

  async getBuffer(key: string): Promise<Buffer> {
    const filePath = this.getLocalPath(key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found in storage: ${key}`);
    }
    return fs.promises.readFile(filePath);
  }

  async getUrl(key: string): Promise<string> {
    return `/storage/${key.replace(/\\/g, '/')}`;
  }

  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getLocalPath(key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (err: any) {
      this.logger.error(`Error deleting storage file ${key}: ${err.message}`);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getLocalPath(key);
    return fs.existsSync(filePath);
  }
}

