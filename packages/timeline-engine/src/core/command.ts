import { Timeline, SerializedCommand } from '@ai-video-studio/video-schema';

export interface TimelineCommand {
  readonly id: string;
  readonly name: string;

  /**
   * Execute the command, returning a NEW immutable timeline instance
   */
  execute(timeline: Timeline): Timeline;

  /**
   * Undo the command, returning a NEW immutable timeline instance restored to previous state
   */
  undo(timeline: Timeline): Timeline;

  /**
   * Convert to serializable format for storage, networking, or AI execution
   */
  toJSON(): SerializedCommand;
}
