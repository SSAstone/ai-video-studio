import { z } from 'zod';
import { ClipSchema, Clip } from './clip';
import { TrackSchema, Track, TrackTypeSchema } from './track';

export const AddClipPayloadSchema = z.object({
  trackId: z.string().uuid(),
  clip: ClipSchema,
});
export type AddClipPayload = z.infer<typeof AddClipPayloadSchema>;

export const RemoveClipPayloadSchema = z.object({
  clipId: z.string().uuid(),
});
export type RemoveClipPayload = z.infer<typeof RemoveClipPayloadSchema>;

export const MoveClipPayloadSchema = z.object({
  clipId: z.string().uuid(),
  targetTrackId: z.string().uuid(),
  newStart: z.number().min(0),
});
export type MoveClipPayload = z.infer<typeof MoveClipPayloadSchema>;

export const TrimClipPayloadSchema = z.object({
  clipId: z.string().uuid(),
  newStart: z.number().min(0),
  newDuration: z.number().min(0.01),
  newSourceStart: z.number().min(0),
});
export type TrimClipPayload = z.infer<typeof TrimClipPayloadSchema>;

export const SplitClipPayloadSchema = z.object({
  clipId: z.string().uuid(),
  splitTime: z.number().min(0), // split position on timeline in seconds
  newClipId: z.string().uuid(), // ID for the second half clip
});
export type SplitClipPayload = z.infer<typeof SplitClipPayloadSchema>;

export const UpdateClipPayloadSchema = z.object({
  clipId: z.string().uuid(),
  updates: ClipSchema.partial(),
});
export type UpdateClipPayload = z.infer<typeof UpdateClipPayloadSchema>;

export const AddTrackPayloadSchema = z.object({
  track: TrackSchema,
});
export type AddTrackPayload = z.infer<typeof AddTrackPayloadSchema>;

export const RemoveTrackPayloadSchema = z.object({
  trackId: z.string().uuid(),
});
export type RemoveTrackPayload = z.infer<typeof RemoveTrackPayloadSchema>;

export const TimelineCommandTypeSchema = z.enum([
  'ADD_CLIP',
  'REMOVE_CLIP',
  'MOVE_CLIP',
  'TRIM_CLIP',
  'SPLIT_CLIP',
  'UPDATE_CLIP',
  'ADD_TRACK',
  'REMOVE_TRACK',
]);
export type TimelineCommandType = z.infer<typeof TimelineCommandTypeSchema>;

export const SerializedCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ADD_CLIP'), payload: AddClipPayloadSchema }),
  z.object({ type: z.literal('REMOVE_CLIP'), payload: RemoveClipPayloadSchema }),
  z.object({ type: z.literal('MOVE_CLIP'), payload: MoveClipPayloadSchema }),
  z.object({ type: z.literal('TRIM_CLIP'), payload: TrimClipPayloadSchema }),
  z.object({ type: z.literal('SPLIT_CLIP'), payload: SplitClipPayloadSchema }),
  z.object({ type: z.literal('UPDATE_CLIP'), payload: UpdateClipPayloadSchema }),
  z.object({ type: z.literal('ADD_TRACK'), payload: AddTrackPayloadSchema }),
  z.object({ type: z.literal('REMOVE_TRACK'), payload: RemoveTrackPayloadSchema }),
]);
export type SerializedCommand = z.infer<typeof SerializedCommandSchema>;

