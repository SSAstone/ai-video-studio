import { Timeline } from '@ai-video-studio/video-schema';

/**
 * Convert seconds to integer frame number
 */
export function secondsToFrames(seconds: number, fps: number = 30): number {
  return Math.round(seconds * fps);
}

/**
 * Convert frame number to seconds with floating point precision
 */
export function framesToSeconds(frames: number, fps: number = 30): number {
  return frames / fps;
}

/**
 * Quantize seconds to exact frame boundaries to prevent floating point drift
 */
export function quantizeToFrames(seconds: number, fps: number = 30): number {
  return framesToSeconds(secondsToFrames(seconds, fps), fps);
}

/**
 * Format seconds into standard SMPTE timecode HH:MM:SS:FF or HH:MM:SS
 */
export function formatTimecode(
  seconds: number,
  fps: number = 30,
  includeFrames: boolean = true
): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;

  const totalFrames = secondsToFrames(seconds, fps);
  const frames = totalFrames % fps;
  const totalSeconds = Math.floor(seconds);
  const secs = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const mins = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad = (n: number, z = 2) => ('00' + n).slice(-z);

  if (includeFrames) {
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  }
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

/**
 * Parse timecode HH:MM:SS:FF or MM:SS to seconds
 */
export function parseTimecode(timecode: string, fps: number = 30): number {
  const parts = timecode.split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return 0;

  if (parts.length === 4) {
    const [h, m, s, f] = parts;
    return h * 3600 + m * 60 + s + framesToSeconds(f, fps);
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  return 0;
}

/**
 * Snap a timestamp in seconds to closest grid step or frame
 */
export function snapToGrid(time: number, snapGridSeconds: number): number {
  if (snapGridSeconds <= 0) return time;
  return Math.round(time / snapGridSeconds) * snapGridSeconds;
}

/**
 * Compute the total active duration across all tracks and clips
 */
export function calculateTimelineDuration(timeline: Timeline): number {
  let maxEnd = 0;
  for (const track of timeline.tracks) {
    for (const clip of track.clips) {
      const clipEnd = clip.start + clip.duration;
      if (clipEnd > maxEnd) {
        maxEnd = clipEnd;
      }
    }
  }
  return Math.max(timeline.duration || 30, maxEnd);
}
