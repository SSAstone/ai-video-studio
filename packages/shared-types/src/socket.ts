export enum SocketEvents {
  // Room joining
  JOIN_PROJECT = 'project:join',
  LEAVE_PROJECT = 'project:leave',

  // Timeline events
  TIMELINE_UPDATE = 'timeline:update',
  TIMELINE_UPDATED = 'timeline:updated',
  PLAYHEAD_MOVE = 'editor:playhead_move',

  // Rendering events
  RENDER_PROGRESS = 'render:progress',
  RENDER_COMPLETED = 'render:completed',
  RENDER_FAILED = 'render:failed',

  // Media events
  MEDIA_PROCESSING = 'media:processing',
  MEDIA_READY = 'media:ready',
  MEDIA_FAILED = 'media:failed',

  // AI events
  AI_JOB_STARTED = 'ai:started',
  AI_JOB_COMPLETED = 'ai:completed',
  AI_JOB_FAILED = 'ai:failed',
}

export interface RenderProgressPayload {
  jobId: string;
  projectId: string;
  progress: number;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  etaSeconds: number;
}

export interface RenderCompletedPayload {
  jobId: string;
  projectId: string;
  outputUrl: string;
  outputSizeBytes: number;
}

