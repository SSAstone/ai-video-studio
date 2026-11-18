import { z } from 'zod';

export const EffectTypeSchema = z.enum([
  'brightness',
  'contrast',
  'saturation',
  'blur',
  'grayscale',
  'sepia',
  'invert',
  'hue_rotate',
  'vignette',
]);

export type EffectType = z.infer<typeof EffectTypeSchema>;

export const EffectConfigSchema = z.object({
  id: z.string().uuid(),
  type: EffectTypeSchema,
  value: z.number().default(1),
  enabled: z.boolean().default(true),
});

export type EffectConfig = z.infer<typeof EffectConfigSchema>;

