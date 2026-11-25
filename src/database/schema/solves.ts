import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, deletedAt, id, updatedAt } from './columns';
import { sessions } from './sessions';

export const PENALTIES = ['none', 'plus2', 'dnf'] as const;
export const SOLVE_SOURCES = ['timer', 'manual'] as const;

export const solves = sqliteTable(
  'solves',
  {
    id: id(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id),
    puzzleId: text('puzzle_id').notNull(),
    /** The exact scramble shown for this solve. Empty only if no scramble was available. */
    scramble: text('scramble').notNull(),
    scrambleGeneratedAt: integer('scramble_generated_at'),
    /** Measured time in milliseconds, before penalties. The final time is always derived. */
    rawTimeMs: integer('raw_time_ms').notNull(),
    penalty: text('penalty', { enum: PENALTIES }).notNull().default('none'),
    inspectionMs: integer('inspection_ms'),
    source: text('source', { enum: SOLVE_SOURCES }).notNull().default('timer'),
    wasInterrupted: integer('was_interrupted', { mode: 'boolean' }).notNull().default(false),
    notes: text('notes'),
    solvedAt: integer('solved_at').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (table) => [
    index('solves_session_time').on(table.sessionId, table.solvedAt),
    index('solves_puzzle_time').on(table.puzzleId, table.solvedAt),
    check('solves_raw_time_non_negative', sql`${table.rawTimeMs} >= 0`),
    check('solves_penalty_valid', sql`${table.penalty} in ('none', 'plus2', 'dnf')`),
    check('solves_source_valid', sql`${table.source} in ('timer', 'manual')`),
  ],
);

export type SolveRow = typeof solves.$inferSelect;
export type NewSolveRow = typeof solves.$inferInsert;
