import { Clip, Timeline, SerializedCommand } from '@ai-video-studio/video-schema';
import { TimelineCommand } from '../core/command';
import { quantizeToFrames } from '../utils/time';

export class SplitClipCommand implements TimelineCommand {
  readonly id = Math.random().toString(36).substring(2, 9);
  readonly name = 'Split Clip';

  private originalDuration: number | null = null;
  private createdClip: Clip | null = null;
  private trackId: string | null = null;

  constructor(
    public readonly clipId: string,
    public readonly splitTime: number,
    public readonly newClipId: string
  ) {}

  execute(timeline: Timeline): Timeline {
    let targetClip: Clip | null = null;
    let targetTrackId: string | null = null;

    for (const track of timeline.tracks) {
      const c = track.clips.find((clip) => clip.id === this.clipId);
      if (c) {
        targetClip = c;
        targetTrackId = track.id;
        break;
      }
    }

    if (!targetClip || !targetTrackId) return timeline;

    const fps = timeline.fps || 30;
    const splitPoint = quantizeToFrames(this.splitTime, fps);

    // Validate that splitPoint is strictly inside the clip
    const clipStart = targetClip.start;
    const clipEnd = targetClip.start + targetClip.duration;
    if (splitPoint <= clipStart + 0.05 || splitPoint >= clipEnd - 0.05) {
      // Split point not inside clip boundaries
      return timeline;
    }

    this.originalDuration = targetClip.duration;
    this.trackId = targetTrackId;

    const firstHalfDuration = quantizeToFrames(splitPoint - clipStart, fps);
    const secondHalfDuration = quantizeToFrames(clipEnd - splitPoint, fps);
    const secondHalfSourceStart = quantizeToFrames(
      targetClip.sourceStart + firstHalfDuration * (targetClip.audio?.speed || 1),
      fps
    );

    const secondHalfClip: Clip = {
      ...targetClip,
      id: this.newClipId,
      name: `${targetClip.name} (Split)`,
      start: splitPoint,
      duration: secondHalfDuration,
      sourceStart: secondHalfSourceStart,
    };

    this.createdClip = secondHalfClip;

    const newTracks = timeline.tracks.map((track) => {
      if (track.id !== targetTrackId) return track;
      return {
        ...track,
        clips: track.clips
          .map((c) => {
            if (c.id === this.clipId) {
              return { ...c, duration: firstHalfDuration };
            }
            return c;
          })
          .concat(secondHalfClip)
          .sort((a, b) => a.start - b.start),
      };
    });

    return {
      ...timeline,
      tracks: newTracks,
      version: (timeline.version || 0) + 1,
    };
  }

  undo(timeline: Timeline): Timeline {
    if (this.originalDuration === null || !this.trackId) {
      return timeline;
    }

    const origDuration = this.originalDuration;
    const targetTrackId = this.trackId;

    const newTracks = timeline.tracks.map((track) => {
      if (track.id !== targetTrackId) return track;
      return {
        ...track,
        clips: track.clips
          .filter((c) => c.id !== this.newClipId)
          .map((c) => {
            if (c.id === this.clipId) {
              return { ...c, duration: origDuration };
            }
            return c;
          })
          .sort((a, b) => a.start - b.start),
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
      type: 'SPLIT_CLIP',
      payload: {
        clipId: this.clipId,
        splitTime: this.splitTime,
        newClipId: this.newClipId,
      },
    };
  }
}

