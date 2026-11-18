import { describe, it, expect, beforeEach } from 'vitest';
import { Timeline, Track, Clip } from '@ai-video-studio/video-schema';
import {
  AddClipCommand,
  RemoveClipCommand,
  MoveClipCommand,
  TrimClipCommand,
  SplitClipCommand,
  UpdateClipCommand,
  AddTrackCommand,
  RemoveTrackCommand,
  HistoryManager,
  secondsToFrames,
  framesToSeconds,
  formatTimecode,
  parseTimecode,
  createCommandFromJSON,
} from '../src';

describe('Time utilities', () => {
  it('converts seconds to frames and back accurately at 30 fps', () => {
    expect(secondsToFrames(1, 30)).toBe(30);
    expect(secondsToFrames(0.5, 30)).toBe(15);
    expect(framesToSeconds(30, 30)).toBe(1);
    expect(framesToSeconds(15, 30)).toBe(0.5);
  });

  it('formats timecode correctly', () => {
    expect(formatTimecode(0, 30)).toBe('00:00:00:00');
    expect(formatTimecode(1.5, 30)).toBe('00:00:01:15');
    expect(formatTimecode(65, 30)).toBe('00:01:05:00');
  });

  it('parses timecode correctly', () => {
    expect(parseTimecode('00:01:05:00', 30)).toBe(65);
    expect(parseTimecode('00:00:01:15', 30)).toBe(1.5);
  });
});

describe('Timeline Engine & Commands', () => {
  let sampleTimeline: Timeline;
  let track1Id: string;
  let track2Id: string;

  beforeEach(() => {
    track1Id = '11111111-1111-1111-1111-111111111111';
    track2Id = '22222222-2222-2222-2222-222222222222';

    sampleTimeline = {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Test Project',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 60,
      backgroundColor: '#000000',
      tracks: [
        {
          id: track1Id,
          type: 'video',
          name: 'Video 1',
          index: 0,
          isLocked: false,
          isMuted: false,
          isVisible: true,
          clips: [],
        },
        {
          id: track2Id,
          type: 'audio',
          name: 'Audio 1',
          index: 1,
          isLocked: false,
          isMuted: false,
          isVisible: true,
          clips: [],
        },
      ],
      version: 1,
    };
  });

  it('adds and removes a clip with undo/redo', () => {
    const history = new HistoryManager(sampleTimeline);
    const clipId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    const clip: Clip = {
      id: clipId,
      trackId: track1Id,
      name: 'Sample Clip',
      type: 'video',
      start: 5,
      duration: 10,
      sourceStart: 0,
      sourceDuration: 20,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, zIndex: 0 },
      audio: { volume: 1, muted: false, speed: 1, fadeInDuration: 0, fadeOutDuration: 0, pan: 0 },
      effects: [],
    };

    // Execute AddClip
    const addCmd = new AddClipCommand(track1Id, clip);
    history.execute(addCmd);

    let state = history.getTimeline();
    expect(state.tracks[0].clips).toHaveLength(1);
    expect(state.tracks[0].clips[0].name).toBe('Sample Clip');
    expect(history.canUndo()).toBe(true);

    // Undo AddClip
    history.undo();
    state = history.getTimeline();
    expect(state.tracks[0].clips).toHaveLength(0);
    expect(history.canRedo()).toBe(true);

    // Redo AddClip
    history.redo();
    state = history.getTimeline();
    expect(state.tracks[0].clips).toHaveLength(1);

    // Remove Clip
    const removeCmd = new RemoveClipCommand(clipId);
    history.execute(removeCmd);
    state = history.getTimeline();
    expect(state.tracks[0].clips).toHaveLength(0);

    // Undo Remove Clip
    history.undo();
    state = history.getTimeline();
    expect(state.tracks[0].clips).toHaveLength(1);
  });

  it('moves a clip across time and tracks', () => {
    const clipId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const clip: Clip = {
      id: clipId,
      trackId: track1Id,
      name: 'Moving Clip',
      type: 'video',
      start: 5,
      duration: 5,
      sourceStart: 0,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, zIndex: 0 },
      audio: { volume: 1, muted: false, speed: 1, fadeInDuration: 0, fadeOutDuration: 0, pan: 0 },
      effects: [],
    };

    sampleTimeline.tracks[0].clips.push(clip);
    const history = new HistoryManager(sampleTimeline);

    // Move to 12s on same track
    const moveCmd = new MoveClipCommand(clipId, track1Id, 12);
    history.execute(moveCmd);

    let state = history.getTimeline();
    expect(state.tracks[0].clips[0].start).toBe(12);

    // Undo move
    history.undo();
    state = history.getTimeline();
    expect(state.tracks[0].clips[0].start).toBe(5);
  });

  it('splits a clip accurately into two clips and supports undo', () => {
    const clipId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const newClipId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    const clip: Clip = {
      id: clipId,
      trackId: track1Id,
      name: 'Long Video',
      type: 'video',
      start: 0,
      duration: 10,
      sourceStart: 2,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, zIndex: 0 },
      audio: { volume: 1, muted: false, speed: 1, fadeInDuration: 0, fadeOutDuration: 0, pan: 0 },
      effects: [],
    };

    sampleTimeline.tracks[0].clips.push(clip);
    const history = new HistoryManager(sampleTimeline);

    // Split at 4.0 seconds
    const splitCmd = new SplitClipCommand(clipId, 4, newClipId);
    history.execute(splitCmd);

    let state = history.getTimeline();
    expect(state.tracks[0].clips).toHaveLength(2);

    const firstHalf = state.tracks[0].clips.find((c) => c.id === clipId)!;
    const secondHalf = state.tracks[0].clips.find((c) => c.id === newClipId)!;

    expect(firstHalf.start).toBe(0);
    expect(firstHalf.duration).toBe(4);
    expect(firstHalf.sourceStart).toBe(2);

    expect(secondHalf.start).toBe(4);
    expect(secondHalf.duration).toBe(6);
    expect(secondHalf.sourceStart).toBe(6); // 2 + 4

    // Undo split
    history.undo();
    state = history.getTimeline();
    expect(state.tracks[0].clips).toHaveLength(1);
    expect(state.tracks[0].clips[0].duration).toBe(10);
  });

  it('deserializes JSON commands correctly via factory', () => {
    const clipId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const cmd = createCommandFromJSON({
      type: 'TRIM_CLIP',
      payload: {
        clipId,
        newStart: 2,
        newDuration: 8,
        newSourceStart: 1,
      },
    });

    expect(cmd.name).toBe('Trim Clip');
    const json = cmd.toJSON();
    expect(json.type).toBe('TRIM_CLIP');
  });
});

