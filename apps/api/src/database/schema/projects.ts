import { pgTable, uuid, varchar, text, integer, doublePrecision, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const folders = pgTable('folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull().default('Untitled Video'),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  aspectRatio: varchar('aspect_ratio', { length: 20 }).notNull().default('16:9'),
  width: integer('width').notNull().default(1920),
  height: integer('height').notNull().default(1080),
  fps: integer('fps').notNull().default(30),
  duration: doublePrecision('duration').notNull().default(30),
  timeline: jsonb('timeline').notNull(), // Stores the complete Timeline JSON
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const editorVersions = pgTable('editor_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  versionNumber: integer('version_number').notNull(),
  timeline: jsonb('timeline').notNull(),
  changeSummary: text('change_summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

