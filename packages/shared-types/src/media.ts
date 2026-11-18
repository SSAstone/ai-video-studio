export enum MediaStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export enum MediaType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
}

export interface MediaMetadata {
  duration?: number; // seconds
  width?: number; // px
  height?: number; // px
  fps?: number;
  codec?: string;
  audioCodec?: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  aspectRatio?: string;
  waveformPeaks?: number[]; // normalized 0-1 for waveform display
}

export interface MediaAssetDto {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  name: string;
  originalFilename: string;
  type: MediaType;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url: string;
  thumbnailUrl?: string | null;
  status: MediaStatus;
  metadata: MediaMetadata;
  createdAt: string;
  updatedAt: string;
}

