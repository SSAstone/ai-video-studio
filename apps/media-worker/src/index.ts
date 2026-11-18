import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const storagePath = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_PATH || './storage');

const connection = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

console.log('Starting AI Video Studio Media Ingestion Worker...');

interface MediaJobPayload {
  mediaId: string;
  storageKey: string;
  mimeType: string;
}

export async function processMediaJob(job: Job<MediaJobPayload>) {
  const { mediaId, storageKey, mimeType } = job.data;
  console.log(`[Media ${mediaId}] Processing metadata & assets for ${storageKey}`);

  const filePath = path.join(storagePath, storageKey);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Media file not found at ${filePath}`);
  }

  // Probe media metadata
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) {
        return resolve({
          duration: 10,
          width: 1920,
          height: 1080,
          fps: 30,
        });
      }

      const videoStream = data.streams.find((s) => s.codec_type === 'video');
      const audioStream = data.streams.find((s) => s.codec_type === 'audio');

      const duration = data.format.duration ? parseFloat(String(data.format.duration)) : 10;
      const width = videoStream?.width || 1920;
      const height = videoStream?.height || 1080;

      resolve({
        duration,
        width,
        height,
        fps: 30,
        codec: videoStream?.codec_name,
        audioCodec: audioStream?.codec_name,
      });
    });
  });
}

const worker = new Worker<MediaJobPayload>(
  'media',
  async (job) => {
    return processMediaJob(job);
  },
  {
    connection,
    concurrency: 4,
  }
);

worker.on('completed', (job) => {
  console.log(`Media worker processed job: ${job.id}`);
});

