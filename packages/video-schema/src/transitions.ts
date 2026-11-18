import { z } from 'zod';

export const TransitionTypeSchema = z.enum([
  'none',
  'fade',
  'crossfade',
  'wipe_left',
  'wipe_right',
  'wipe_up',
  'wipe_down',
  'slide_left',
  'slide_right',
  'zoom_in',
  'zoom_out',
  'dissolve',
]);

export type TransitionType = z.infer<typeof TransitionTypeSchema>;

export const TransitionConfigSchema = z.object({
  id: z.string().uuid(),
  type: TransitionTypeSchema.default('none'),
  duration: z.number().min(0.1).max(5).default(0.5), // in seconds
  clipIdA: z.string().uuid().optional(),
  clipIdB: z.string().uuid().optional(),
});

export type TransitionConfig = z.infer<typeof TransitionConfigSchema>;

