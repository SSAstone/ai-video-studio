import { SerializedCommand } from '@ai-video-studio/video-schema';
import { TimelineCommand } from '../core/command';
import { AddClipCommand } from './add-clip';
import { RemoveClipCommand } from './remove-clip';
import { MoveClipCommand } from './move-clip';
import { TrimClipCommand } from './trim-clip';
import { SplitClipCommand } from './split-clip';
import { UpdateClipCommand } from './update-clip';
import { AddTrackCommand } from './add-track';
import { RemoveTrackCommand } from './remove-track';

export function createCommandFromJSON(serialized: SerializedCommand): TimelineCommand {
  switch (serialized.type) {
    case 'ADD_CLIP':
      return new AddClipCommand(serialized.payload.trackId, serialized.payload.clip as any);
    case 'REMOVE_CLIP':
      return new RemoveClipCommand(serialized.payload.clipId);
    case 'MOVE_CLIP':
      return new MoveClipCommand(
        serialized.payload.clipId,
        serialized.payload.targetTrackId,
        serialized.payload.newStart
      );
    case 'TRIM_CLIP':
      return new TrimClipCommand(
        serialized.payload.clipId,
        serialized.payload.newStart,
        serialized.payload.newDuration,
        serialized.payload.newSourceStart
      );
    case 'SPLIT_CLIP':
      return new SplitClipCommand(
        serialized.payload.clipId,
        serialized.payload.splitTime,
        serialized.payload.newClipId
      );
    case 'UPDATE_CLIP':
      return new UpdateClipCommand(serialized.payload.clipId, serialized.payload.updates as any);
    case 'ADD_TRACK':
      return new AddTrackCommand(serialized.payload.track as any);
    case 'REMOVE_TRACK':
      return new RemoveTrackCommand(serialized.payload.trackId);
    default:
      throw new Error(`Unknown command type: ${(serialized as any).type}`);
  }
}

