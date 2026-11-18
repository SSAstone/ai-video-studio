import { Clip, Timeline, SerializedCommand } from '@ai-video-studio/video-schema';
import { TimelineCommand } from '../core/command';
import { quantizeToFrames } from '../utils/time';

export class TrimClipCommand implements TimelineCommand {
  readonly id = Math.random().toString(36).substring(2, 9);
  readonly name = 'Trim Clip';

  private originalStart: number | null = null;
  private originalDuration: number | null = null;
  private originalSourceStart: number | null = null;

  constructor(
    public readonly clipId: string,
    public readonly newStart: number,
    public readonly newDuration: number,
    public readonly newSourceStart: number
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

    this.originalStart = targetClip.start;
    this.originalDuration = targetClip.duration;
    this.originalSourceStart = targetClip.sourceStart;

    const fps = timeline.fps || 30;
    const sanitizedStart = quantizeToFrames(Math.max(0, this.newStart), fps);
    const sanitizedDuration = quantizeToFrames(Math.max(0.01, this.newDuration), fps);
    const sanitizedSourceStart = quantizeToFrames(Math.max(0, this.newSourceStart), fps);

    const newTracks = timeline.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id !== this.clipId) return clip;
        return {
          ...clip,
          start: sanitizedStart,
          duration: sanitizedDuration,
          sourceStart: sanitizedSourceStart,
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
    if (
      this.originalStart === null ||
      this.originalDuration === null ||
      this.originalSourceStart === null
    ) {
      return timeline;
    }

    const origStart = this.originalStart;
    const origDuration = this.originalDuration;
    const origSourceStart = this.originalSourceStart;

    const newTracks = timeline.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id !== this.clipId) return clip;
        return {
          ...clip,
          start: origStart,
          duration: origDuration,
          sourceStart: origSourceStart,
        };
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
      type: 'TRIM_CLIP',
      payload: {
        clipId: this.clipId,
        newStart: this.newStart,
        newDuration: this.newDuration,
        newSourceStart: this.newSourceStart,
      },
    };
  }
}

