import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, deletedAt, id, updatedAt } from './columns';

/**
 * What a goal measures. Progress is always computed from solves and training data,
 * never stored, so it can't drift from the truth.
 * - solves: N solves (of a puzzle) after the goal was set
 * - time: a single or average below a target time
 * - algorithms: every case of a set marked learned
 * - streak: practise on N days in a row
 * - daily: N solves every day (a recurring goal shown on Home)
 * - custom: anything else, completed by hand
 */
export const GOAL_TYPES = ['solves', 'time', 'algorithms', 'streak', 'daily', 'custom'] as const;
export type GoalType = (typeof GOAL_TYPES)[number];
export const GOAL_STATS = ['single', 'ao5', 'ao12'] as const;
export type GoalStat = (typeof GOAL_STATS)[number];

export const goals = sqliteTable(
  'goals',
  {
    id: id(),
    type: text('type', { enum: GOAL_TYPES }).notNull(),
    title: text('title').notNull(),
    notes: text('notes'),
    /** Count, days, or milliseconds for time goals. Null for custom goals. */
    target: integer('target'),
    /** Puzzle for solves and time goals (null = any puzzle for solves). */
    puzzleId: text('puzzle_id'),
    /** Which result a time goal is about. */
    stat: text('stat', { enum: GOAL_STATS }),
    /** Algorithm set for algorithm goals: f2l, oll or pll. */
    algorithmSet: text('algorithm_set'),
    /** When the goal was first reached (or marked done). Null = still open. */
    completedAt: integer('completed_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (table) => [
    index('goals_completed').on(table.completedAt),
    check('goals_title_not_blank', sql`length(trim(${table.title})) > 0`),
    check('goals_target_positive', sql`${table.target} IS NULL OR ${table.target} > 0`),
  ],
);

export type GoalRow = typeof goals.$inferSelect;
