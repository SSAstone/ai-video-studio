import { pgTable, uuid, varchar, text, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(), // free, pro, enterprise
  monthlyCredits: integer('monthly_credits').notNull().default(100),
  maxResolution: varchar('max_resolution', { length: 20 }).notNull().default('1080p'),
  maxStorageMb: integer('max_storage_mb').notNull().default(5000),
  priceMonthlyCents: integer('price_monthly_cents').notNull().default(0),
  features: jsonb('features').notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).defaultNow().notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('usd'),
  status: varchar('status', { length: 50 }).notNull().default('succeeded'),
  provider: varchar('provider', { length: 50 }).notNull().default('local_mock'),
  providerTransactionId: text('provider_transaction_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // subscription_grant, render_deduction, ai_deduction, manual_add
  description: text('description').notNull(),
  referenceId: uuid('reference_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usageRecords = pgTable('usage_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  metric: varchar('metric', { length: 50 }).notNull(), // 'render_minutes', 'storage_bytes', 'ai_tokens'
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
});

