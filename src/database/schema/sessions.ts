import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, deletedAt, id, updatedAt } from './columns';

export const SOLVING_METHODS = ['cfop', 'roux', 'zz', 'beginner', 'other'] as const;
export type SolvingMethod = (typeof SOLVING_METHODS)[number];

export const SESSION_PURPOSES = ['daily', 'goal', 'competition', 'other'] as const;
export type SessionPurpose = (typeof SESSION_PURPOSES)[number];

export const sessions = sqliteTable(
  'sessions',
  {
    id: id(),
    name: text('name').notNull(),
    /** WCA event id, e.g. '333'. Puzzle definitions live in code (constants/puzzles.ts). */
    puzzleId: text('puzzle_id').notNull(),
    method: text('method', { enum: SOLVING_METHODS }),
    purpose: text('purpose', { enum: SESSION_PURPOSES }),
    isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (table) => [
    index('sessions_updated').on(table.updatedAt),
    check('sessions_name_not_blank', sql`length(trim(${table.name})) > 0`),
  ],
);

export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;
