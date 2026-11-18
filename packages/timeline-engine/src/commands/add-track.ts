import { Track, Timeline, SerializedCommand } from '@ai-video-studio/video-schema';
import { TimelineCommand } from '../core/command';

export class AddTrackCommand implements TimelineCommand {
  readonly id = Math.random().toString(36).substring(2, 9);
  readonly name = 'Add Track';

  constructor(public readonly track: Track) { }

  execute(timeline: Timeline): Timeline {
    return {
      ...timeline,
      tracks: [...timeline.tracks, this.track].map((t, idx) => ({
        ...t,
        index: idx,
      })),
      version: (timeline.version || 0) + 1,
    };
  }

  undo(timeline: Timeline): Timeline {
    return {
      ...timeline,
      tracks: timeline.tracks
        .filter((t) => t.id !== this.track.id)
        .map((t, idx) => ({ ...t, index: idx })),
      version: (timeline.version || 0) + 1,
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'ADD_TRACK',
      payload: {
        track: this.track,
      },
    };
  }
}