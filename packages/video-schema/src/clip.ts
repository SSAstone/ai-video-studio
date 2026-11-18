import { z } from 'zod';
import { TransformSchema } from './transform';
import { AudioSettingsSchema } from './audio';
import { TextConfigSchema } from './text';
import { TransitionConfigSchema } from './transitions';
import { EffectConfigSchema } from './effects';

export const ClipTypeSchema = z.enum(['video', 'audio', 'image', 'text']);
export type ClipType = z.infer<typeof ClipTypeSchema>;

export const ClipSchema = z.object({
  id: z.string().uuid(),
  trackId: z.string().uuid(),
  name: z.string().default('Untitled Clip'),
  type: ClipTypeSchema,
  start: z.number().min(0).default(0), // start time in timeline (seconds)
  duration: z.number().min(0.01).default(5), // duration on timeline (seconds)
  sourceStart: z.number().min(0).default(0), // offset inside media (seconds)
  sourceDuration: z.number().min(0.01).optional(), // original asset duration (seconds)
  mediaId: z.string().uuid().optional(),
  mediaUrl: z.string().optional(),
  transform: TransformSchema.default({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    zIndex: 0,
  }),
  audio: AudioSettingsSchema.default({
    volume: 1,
    muted: false,
    speed: 1,
    fadeInDuration: 0,
    fadeOutDuration: 0,
    pan: 0,
  }),
  text: TextConfigSchema.optional(),
  transitionIn: TransitionConfigSchema.optional(),
  transitionOut: TransitionConfigSchema.optional(),
  effects: z.array(EffectConfigSchema).default([]),
});

export type Clip = z.infer<typeof ClipSchema>;

