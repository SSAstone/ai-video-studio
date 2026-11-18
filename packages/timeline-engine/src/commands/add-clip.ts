import { Clip, Timeline, SerializedCommand } from '@ai-video-studio/video-schema';
import { TimelineCommand } from '../core/command';
import { quantizeToFrames } from '../utils/time';

export class AddClipCommand implements TimelineCommand {
  readonly id = Math.random().toString(36).substring(2, 9);
  readonly name = 'Add Clip';

  constructor(
    public readonly trackId: string,
    public readonly clip: Clip
  ) {}

  execute(timeline: Timeline): Timeline {
    const fps = timeline.fps || 30;
    const sanitizedClip: Clip = {
      ...this.clip,
      start: quantizeToFrames(Math.max(0, this.clip.start), fps),
      duration: quantizeToFrames(Math.max(0.01, this.clip.duration), fps),
    };

    const newTracks = timeline.tracks.map((track) => {
      if (track.id !== this.trackId) return track;
      return {
        ...track,
        clips: [...track.clips, sanitizedClip].sort((a, b) => a.start - b.start),
      };
    });

    return {
      ...timeline,
      tracks: newTracks,
      version: (timeline.version || 0) + 1,
    };
  }

  undo(timeline: Timeline): Timeline {
    const newTracks = timeline.tracks.map((track) => {
      if (track.id !== this.trackId) return track;
      return {
        ...track,
        clips: track.clips.filter((c) => c.id !== this.clip.id),
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
      type: 'ADD_CLIP',
      payload: {
        trackId: this.trackId,
        clip: this.clip,
      },
    };
  }
}

