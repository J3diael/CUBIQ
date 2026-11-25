import { sql } from 'drizzle-orm';
import { check, index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, deletedAt, id, updatedAt } from './columns';

export const LEARNING_STATUSES = ['new', 'learning', 'learned'] as const;
export type LearningStatus = (typeof LEARNING_STATUSES)[number];

/**
 * Training progress for one case: a built-in case id such as "pll.t", or
 * "custom:<id>" for a user's own algorithm. Built-in cases live in code
 * (src/content), so there is no foreign key for them.
 */
export const algorithmProgress = sqliteTable(
  'algorithm_progress',
  {
    caseKey: text('case_key').primaryKey(),
    status: text('status', { enum: LEARNING_STATUSES }).notNull().default('new'),
    isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
    /** The algorithm the user chose to learn (built-in or custom text). Null = the default. */
    preferredAlgorithm: text('preferred_algorithm'),
    notes: text('notes'),
    // Spaced repetition (a simplified SM-2).
    ease: real('ease').notNull().default(2.5),
    intervalDays: real('interval_days').notNull().default(0),
    dueAt: integer('due_at'),
    reviews: integer('reviews').notNull().default(0),
    correct: integer('correct').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    lastReviewedAt: integer('last_reviewed_at'),
    // Execution practice.
    executions: integer('executions').notNull().default(0),
    bestExecutionMs: integer('best_execution_ms'),
    lastExecutionMs: integer('last_execution_ms'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('algorithm_progress_due').on(table.dueAt),
    check('algorithm_progress_counts', sql`${table.correct} <= ${table.reviews}`),
  ],
);

export const CUSTOM_ALGORITHM_SETS = ['f2l', 'oll', 'pll', 'other'] as const;
export type CustomAlgorithmSet = (typeof CUSTOM_ALGORITHM_SETS)[number];

/** Algorithms the user adds: alternatives for built-in cases, or their own collections. */
export const customAlgorithms = sqliteTable(
  'custom_algorithms',
  {
    id: id(),
    /** Built-in case this is an alternative for, e.g. "oll.21". Null for standalone algorithms. */
    caseId: text('case_id'),
    set: text('set', { enum: CUSTOM_ALGORITHM_SETS }).notNull(),
    /** Free-form collection name to organise standalone algorithms, e.g. "COLL". */
    collection: text('collection'),
    name: text('name').notNull(),
    algorithm: text('algorithm').notNull(),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (table) => [
    index('custom_algorithms_case').on(table.caseId),
    check('custom_algorithms_name_not_blank', sql`length(trim(${table.name})) > 0`),
    check('custom_algorithms_alg_not_blank', sql`length(trim(${table.algorithm})) > 0`),
  ],
);

export type AlgorithmProgressRow = typeof algorithmProgress.$inferSelect;
export type CustomAlgorithmRow = typeof customAlgorithms.$inferSelect;
