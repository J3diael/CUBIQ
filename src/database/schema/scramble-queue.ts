import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Scrambles generated ahead of time, so one is ready instantly even on a cold start. */
export const scrambleQueue = sqliteTable(
  'scramble_queue',
  {
    id: text('id').primaryKey(),
    puzzleId: text('puzzle_id').notNull(),
    scramble: text('scramble').notNull(),
    generatedAt: integer('generated_at').notNull(),
  },
  (table) => [index('scramble_queue_puzzle').on(table.puzzleId, table.generatedAt)],
);
