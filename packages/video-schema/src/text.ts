import { z } from 'zod';

export const TextConfigSchema = z.object({
  content: z.string().default('Text'),
  fontFamily: z.string().default('Inter, sans-serif'),
  fontSize: z.number().min(8).max(300).default(48),
  fontWeight: z.enum(['300', '400', '500', '600', '700', '800', '900']).default('700'),
  fontStyle: z.enum(['normal', 'italic']).default('normal'),
  color: z.string().default('#FFFFFF'),
  backgroundColor: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
  letterSpacing: z.number().default(0),
  lineHeight: z.number().default(1.2),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().min(0).max(20).default(0),
  shadowColor: z.string().optional(),
  shadowBlur: z.number().min(0).max(50).default(0),
  shadowOffsetX: z.number().default(0),
  shadowOffsetY: z.number().default(0),
  padding: z.number().min(0).default(8),
  borderRadius: z.number().min(0).default(4),
});

export type TextConfig = z.infer<typeof TextConfigSchema>;

