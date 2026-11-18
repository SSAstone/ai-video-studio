import { z } from 'zod';
import { TrackSchema } from './track';

export const TimelineSchema = z.object({
  id: z.string().uuid(),
  name: z.string().default('Untitled Project'),
  width: z.number().int().min(100).max(7680).default(1920),
  height: z.number().int().min(100).max(4320).default(1080),
  fps: z.number().int().min(12).max(120).default(30),
  duration: z.number().min(0).default(30), // Duration in seconds
  backgroundColor: z.string().default('#000000'),
  tracks: z.array(TrackSchema).default([]),
  version: z.number().int().default(1),
  metadata: z.record(z.any()).optional(),
});

export type Timeline = z.infer<typeof TimelineSchema>;

export const AspectRatioPreset = {
  LANDSCAPE_16_9: { label: '16:9 (YouTube, TV)', width: 1920, height: 1080 },
  PORTRAIT_9_16: { label: '9:16 (TikTok, Reels, Shorts)', width: 1080, height: 1920 },
  SQUARE_1_1: { label: '1:1 (Instagram)', width: 1080, height: 1080 },
  VERTICAL_4_5: { label: '4:5 (Instagram Feed)', width: 1080, height: 1350 },
  CINEMA_21_9: { label: '21:9 (Ultrawide)', width: 2560, height: 1080 },
} as const;

export type AspectRatioType = keyof typeof AspectRatioPreset;

