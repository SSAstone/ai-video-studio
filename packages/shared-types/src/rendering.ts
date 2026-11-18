export enum RenderJobStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum ExportFormat {
  MP4 = 'mp4',
  WEBM = 'webm',
  GIF = 'gif',
}

export enum ExportResolution {
  RES_720P = '720p',
  RES_1080P = '1080p',
  RES_4K = '4k',
  CUSTOM = 'custom',
}

export interface RenderOptions {
  format: ExportFormat;
  resolution: ExportResolution;
  width: number;
  height: number;
  fps: number;
  bitrateKbps?: number;
  audioBitrateKbps?: number;
  quality?: 'fast' | 'balanced' | 'high';
}

export interface RenderJobDto {
  id: string;
  projectId: string;
  workspaceId: string;
  userId: string;
  status: RenderJobStatus;
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
  options: RenderOptions;
  outputStorageKey?: string | null;
  outputUrl?: string | null;
  outputSizeBytes?: number | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

