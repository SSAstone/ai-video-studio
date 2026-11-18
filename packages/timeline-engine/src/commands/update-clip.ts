import { Clip, Timeline, SerializedCommand } from '@ai-video-studio/video-schema';
import { TimelineCommand } from '../core/command';

export class UpdateClipCommand implements TimelineCommand {
  readonly id = Math.random().toString(36).substring(2, 9);
  readonly name = 'Update Clip Properties';

  private previousClipState: Clip | null = null;

  constructor(
    public readonly clipId: string,
    public readonly updates: Partial<Clip>
  ) {}

  execute(timeline: Timeline): Timeline {
    let targetClip: Clip | null = null;

    for (const track of timeline.tracks) {
      const c = track.clips.find((clip) => clip.id === this.clipId);
      if (c) {
        targetClip = c;
        break;
      }
    }

    if (!targetClip) return timeline;

    this.previousClipState = { ...targetClip };

    const newTracks = timeline.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id !== this.clipId) return clip;
        return {
          ...clip,
          ...this.updates,
          // Deep merge transform and audio if provided
          transform: this.updates.transform
            ? { ...clip.transform, ...this.updates.transform }
            : clip.transform,
          audio: this.updates.audio
            ? { ...clip.audio, ...this.updates.audio }
            : clip.audio,
          text: this.updates.text
            ? { ...(clip.text || {}), ...this.updates.text } as any
            : clip.text,
        };
      }),
    }));

    return {
      ...timeline,
      tracks: newTracks,
      version: (timeline.version || 0) + 1,
    };
  }

  undo(timeline: Timeline): Timeline {
    if (!this.previousClipState) return timeline;

    const prevState = this.previousClipState;

    const newTracks = timeline.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id !== this.clipId) return clip;
        return prevState;
      }),
    }));

    return {
      ...timeline,
      tracks: newTracks,
      version: (timeline.version || 0) + 1,
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'UPDATE_CLIP',
      payload: {
        clipId: this.clipId,
        updates: this.updates,
      },
    };
  }
}

