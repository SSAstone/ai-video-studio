import { z } from 'zod';

export const AudioSettingsSchema = z.object({
  volume: z.number().min(0).max(2).default(1), // 1.0 = 100%
  muted: z.boolean().default(false),
  speed: z.number().min(0.1).max(10).default(1),
  fadeInDuration: z.number().min(0).default(0), // in seconds
  fadeOutDuration: z.number().min(0).default(0), // in seconds
  pan: z.number().min(-1).max(1).default(0), // -1 left, +1 right
});

export type AudioSettings = z.infer<typeof AudioSettingsSchema>;

