import { UserRole, WorkspaceRole } from './auth';
import { MediaStatus, MediaType, MediaMetadata } from './media';
import { RenderJobStatus, RenderOptions } from './rendering';
import { Timeline } from '@ai-video-studio/video-schema';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  creditBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  aspectRatio: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  timeline: Timeline;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  workspaceId: string;
  name: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EditorVersion {
  id: string;
  projectId: string;
  userId?: string | null;
  versionNumber: number;
  timeline: Timeline;
  changeSummary?: string | null;
  createdAt: string;
}

export interface AiJob {
  id: string;
  projectId: string;
  userId: string;
  prompt: string;
  type: 'edit_plan' | 'subtitles' | 'silence_removal' | 'resize';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: any;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  code: string; // 'free', 'pro', 'enterprise'
  monthlyCredits: number;
  maxResolution: string;
  maxStorageMb: number;
  priceMonthlyCents: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  workspaceId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  workspaceId: string;
  amount: number; // positive = added, negative = deducted
  balanceAfter: number;
  type: 'subscription_grant' | 'manual_add' | 'render_deduction' | 'ai_deduction';
  description: string;
  referenceId?: string | null;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  thumbnailUrl?: string | null;
  aspectRatio: string;
  timeline: Timeline;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  data?: any;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId?: string | null;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: any;
  ipAddress?: string | null;
  createdAt: string;
}

