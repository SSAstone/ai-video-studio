import { z } from 'zod';
import { SerializedCommandSchema } from './commands';

export const AiEditPlanSchema = z.object({
  id: z.string().uuid(),
  prompt: z.string(),
  explanation: z.string(),
  commands: z.array(SerializedCommandSchema),
  affectedClipIds: z.array(z.string().uuid()).default([]),
  durationDelta: z.number().default(0), // change in duration (+/- seconds)
  confidence: z.number().min(0).max(1).default(0.95),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type AiEditPlan = z.infer<typeof AiEditPlanSchema>;

export const AiPromptRequestSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(1).max(2000),
  timelineSnapshot: z.any().optional(),
});

export type AiPromptRequest = z.infer<typeof AiPromptRequestSchema>;

