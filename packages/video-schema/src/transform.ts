import { z } from 'zod';

export const TransformSchema = z.object({
  x: z.number().default(0), // Center offset in px or %
  y: z.number().default(0),
  scale: z.number().min(0.01).max(10).default(1),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  rotation: z.number().min(-360).max(360).default(0), // in degrees
  opacity: z.number().min(0).max(1).default(1),
  zIndex: z.number().int().default(0),
});

export type Transform = z.infer<typeof TransformSchema>;

