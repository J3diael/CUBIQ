import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, updatedAt } from './columns';

/**
 * Progress through one beginner lesson. Lessons live in code (src/content/lessons),
 * keyed by stable ids such as "beginner.cross", so there is no foreign key.
 */
export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    lessonId: text('lesson_id').primaryKey(),
    /** The step the user last reached, to resume there. */
    lastStep: integer('last_step').notNull().default(0),
    /** When the practice questions were first finished. Null = not completed. */
    completedAt: integer('completed_at'),
    /** Best practice result, as correct answers out of `practiceTotal`. */
    bestScore: integer('best_score'),
    practiceTotal: integer('practice_total'),
    attempts: integer('attempts').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check('lesson_progress_step', sql`${table.lastStep} >= 0`),
    check(
      'lesson_progress_score',
      sql`${table.bestScore} IS NULL OR (${table.bestScore} >= 0 AND ${table.bestScore} <= ${table.practiceTotal})`,
    ),
  ],
);

export type LessonProgressRow = typeof lessonProgress.$inferSelect;
