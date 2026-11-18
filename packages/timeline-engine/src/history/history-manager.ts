import { Timeline } from '@ai-video-studio/video-schema';
import { TimelineCommand } from '../core/command';

export interface HistoryListener {
  (timeline: Timeline, canUndo: boolean, canRedo: boolean): void;
}

export class HistoryManager {
  private undoStack: TimelineCommand[] = [];
  private redoStack: TimelineCommand[] = [];
  private listeners: Set<HistoryListener> = new Set();

  constructor(
    private currentTimeline: Timeline,
    private readonly maxHistoryDepth: number = 50
  ) { }

  public getTimeline(): Timeline {
    return this.currentTimeline;
  }

  public setTimeline(timeline: Timeline, resetHistory: boolean = false): void {
    this.currentTimeline = timeline;
    if (resetHistory) {
      this.undoStack = [];
      this.redoStack = [];
    }
    this.notify();
  }

  public execute(command: TimelineCommand): Timeline {
    this.currentTimeline = command.execute(this.currentTimeline);
    this.undoStack.push(command);

    if (this.undoStack.length > this.maxHistoryDepth) {
      this.undoStack.shift();
    }

    // Any new command clears the redo stack
    this.redoStack = [];

    this.notify();
    return this.currentTimeline;
  }

  public undo(): Timeline | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    const command = this.undoStack.pop()!;
    this.currentTimeline = command.undo(this.currentTimeline);
    this.redoStack.push(command);

    this.notify();
    return this.currentTimeline;
  }

  public redo(): Timeline | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const command = this.redoStack.pop()!;
    this.currentTimeline = command.execute(this.currentTimeline);
    this.undoStack.push(command);

    this.notify();
    return this.currentTimeline;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoCount(): number {
    return this.undoStack.length;
  }

  public getRedoCount(): number {
    return this.redoStack.length;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  public subscribe(listener: HistoryListener): () => void {
    this.listeners.add(listener);
    listener(this.currentTimeline, this.canUndo(), this.canRedo());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentTimeline, this.canUndo(), this.canRedo());
    }
  }
}
