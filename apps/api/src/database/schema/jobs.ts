import { pgTable, uuid, varchar, text, integer, bigint, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { workspaces } from './workspaces';
import { users } from './users';

export const renderJobs = pgTable('render_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('QUEUED'), // QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED
  progress: integer('progress').notNull().default(0), // 0 to 100
  currentFrame: integer('current_frame'),
  totalFrames: integer('total_frames'),
  options: jsonb('options').notNull(), // format, resolution, fps, bitrate
  outputStorageKey: text('output_storage_key'),
  outputUrl: text('output_url'),
  outputSizeBytes: bigint('output_size_bytes', { mode: 'number' }),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiJobs = pgTable('ai_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('edit_plan'),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  result: jsonb('result'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

