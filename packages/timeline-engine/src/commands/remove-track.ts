import { Track, Timeline, SerializedCommand } from '@ai-video-studio/video-schema';
import { TimelineCommand } from '../core/command';

export class RemoveTrackCommand implements TimelineCommand {
  readonly id = Math.random().toString(36).substring(2, 9);
  readonly name = 'Remove Track';

  private removedTrack: Track | null = null;
  private originalIndex: number = 0;

  constructor(public readonly trackId: string) {}

  execute(timeline: Timeline): Timeline {
    const trackIndex = timeline.tracks.findIndex((t) => t.id === this.trackId);
    if (trackIndex === -1) return timeline;

    this.removedTrack = timeline.tracks[trackIndex];
    this.originalIndex = trackIndex;

    const newTracks = timeline.tracks
      .filter((t) => t.id !== this.trackId)
      .map((t, idx) => ({ ...t, index: idx }));

    return {
      ...timeline,
      tracks: newTracks,
      version: (timeline.version || 0) + 1,
    };
  }

  undo(timeline: Timeline): Timeline {
    if (!this.removedTrack) return timeline;

    const tracks = [...timeline.tracks];
    tracks.splice(this.originalIndex, 0, this.removedTrack);

    return {
      ...timeline,
      tracks: tracks.map((t, idx) => ({ ...t, index: idx })),
      version: (timeline.version || 0) + 1,
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'REMOVE_TRACK',
      payload: {
        trackId: this.trackId,
      },
    };
  }
}

