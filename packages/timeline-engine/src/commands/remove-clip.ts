import { Clip, Timeline, SerializedCommand } from '@ai-video-studio/video-schema';
import { TimelineCommand } from '../core/command';

export class RemoveClipCommand implements TimelineCommand {
  readonly id = Math.random().toString(36).substring(2, 9);
  readonly name = 'Remove Clip';

  private removedClip: Clip | null = null;
  private trackId: string | null = null;

  constructor(public readonly clipId: string) {}

  execute(timeline: Timeline): Timeline {
    let foundTrackId: string | null = null;
    let foundClip: Clip | null = null;

    for (const track of timeline.tracks) {
      const clip = track.clips.find((c) => c.id === this.clipId);
      if (clip) {
        foundTrackId = track.id;
        foundClip = clip;
        break;
      }
    }

    if (!foundClip || !foundTrackId) {
      return timeline;
    }

    this.removedClip = foundClip;
    this.trackId = foundTrackId;

    const newTracks = timeline.tracks.map((track) => {
      if (track.id !== foundTrackId) return track;
      return {
        ...track,
        clips: track.clips.filter((c) => c.id !== this.clipId),
      };
    });

    return {
      ...timeline,
      tracks: newTracks,
      version: (timeline.version || 0) + 1,
    };
  }

  undo(timeline: Timeline): Timeline {
    if (!this.removedClip || !this.trackId) return timeline;

    const savedClip = this.removedClip;
    const targetTrackId = this.trackId;

    const newTracks = timeline.tracks.map((track) => {
      if (track.id !== targetTrackId) return track;
      return {
        ...track,
        clips: [...track.clips, savedClip].sort((a, b) => a.start - b.start),
      };
    });

    return {
      ...timeline,
      tracks: newTracks,
      version: (timeline.version || 0) + 1,
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'REMOVE_CLIP',
      payload: {
        clipId: this.clipId,
      },
    };
  }
}

