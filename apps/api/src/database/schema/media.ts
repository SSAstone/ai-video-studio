import { pgTable, uuid, varchar, text, bigint, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';
import { folders } from './projects';

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // VIDEO, AUDIO, IMAGE
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  storageKey: text('storage_key').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  status: varchar('status', { length: 50 }).notNull().default('PROCESSING'), // PENDING, PROCESSING, READY, FAILED
  metadata: jsonb('metadata').notNull().default({}), // duration, width, height, fps, waveformPeaks, codec
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

