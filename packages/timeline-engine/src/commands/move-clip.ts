import { Clip, Timeline, SerializedCommand } from '@ai-video-studio/video-schema';
import { TimelineCommand } from '../core/command';
import { quantizeToFrames } from '../utils/time';

export class MoveClipCommand implements TimelineCommand {
  readonly id = Math.random().toString(36).substring(2, 9);
  readonly name = 'Move Clip';

  private originalTrackId: string | null = null;
  private originalStart: number | null = null;

  constructor(
    public readonly clipId: string,
    public readonly targetTrackId: string,
    public readonly newStart: number
  ) {}

  execute(timeline: Timeline): Timeline {
    let sourceTrackId: string | null = null;
    let clipToMove: Clip | null = null;

    for (const track of timeline.tracks) {
      const clip = track.clips.find((c) => c.id === this.clipId);
      if (clip) {
        sourceTrackId = track.id;
        clipToMove = clip;
        break;
      }
    }

    if (!clipToMove || !sourceTrackId) {
      return timeline;
    }

    this.originalTrackId = sourceTrackId;
    this.originalStart = clipToMove.start;

    const fps = timeline.fps || 30;
    const sanitizedStart = quantizeToFrames(Math.max(0, this.newStart), fps);

    const updatedClip: Clip = {
      ...clipToMove,
      trackId: this.targetTrackId,
      start: sanitizedStart,
    };

    const newTracks = timeline.tracks.map((track) => {
      // Remove from old track
      let clips = track.clips.filter((c) => c.id !== this.clipId);

      // Add to new track if it's the target
      if (track.id === this.targetTrackId) {
        clips = [...clips, updatedClip].sort((a, b) => a.start - b.start);
      }

      return {
        ...track,
        clips,
      };
    });

    return {
      ...timeline,
      tracks: newTracks,
      version: (timeline.version || 0) + 1,
    };
  }

  undo(timeline: Timeline): Timeline {
    if (this.originalTrackId === null || this.originalStart === null) {
      return timeline;
    }

    let currentClip: Clip | null = null;
    for (const track of timeline.tracks) {
      const c = track.clips.find((clip) => clip.id === this.clipId);
      if (c) {
        currentClip = c;
        break;
      }
    }

    if (!currentClip) return timeline;

    const restoredClip: Clip = {
      ...currentClip,
      trackId: this.originalTrackId,
      start: this.originalStart,
    };

    const originalTrackId = this.originalTrackId;
    const newTracks = timeline.tracks.map((track) => {
      let clips = track.clips.filter((c) => c.id !== this.clipId);
      if (track.id === originalTrackId) {
        clips = [...clips, restoredClip].sort((a, b) => a.start - b.start);
      }
      return {
        ...track,
        clips,
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
      type: 'MOVE_CLIP',
      payload: {
        clipId: this.clipId,
        targetTrackId: this.targetTrackId,
        newStart: this.newStart,
      },
    };
  }
}

