import { z } from 'zod';
import { ClipSchema } from './clip';

export const TrackTypeSchema = z.enum(['video', 'audio', 'text']);
export type TrackType = z.infer<typeof TrackTypeSchema>;

export const TrackSchema = z.object({
  id: z.string().uuid(),
  type: TrackTypeSchema,
  name: z.string().default('Track'),
  index: z.number().int().min(0).default(0),
  isLocked: z.boolean().default(false),
  isMuted: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  clips: z.array(ClipSchema).default([]),
});

export type Track = z.infer<typeof TrackSchema>;

