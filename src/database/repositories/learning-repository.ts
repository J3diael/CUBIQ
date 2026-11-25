import { eq } from 'drizzle-orm';
import { z } from 'zod';

import type { AppDatabase } from '../client';
import { lessonProgress, type LessonProgressRow } from '../schema';

export type LessonProgress = Omit<LessonProgressRow, 'createdAt'>;

export function emptyLessonProgress(lessonId: string): LessonProgress {
  return {
    lessonId,
    lastStep: 0,
    completedAt: null,
    bestScore: null,
    practiceTotal: null,
    attempts: 0,
    updatedAt: 0,
  };
}

/** Every lesson with progress, keyed by lesson id. */
export function listLessonProgress(db: AppDatabase): Map<string, LessonProgress> {
  return new Map(
    db
      .select()
      .from(lessonProgress)
      .all()
      .map((row) => [row.lessonId, row]),
  );
}

export function getLessonProgress(db: AppDatabase, lessonId: string): LessonProgress {
  return (
    db.select().from(lessonProgress).where(eq(lessonProgress.lessonId, lessonId)).get() ??
    emptyLessonProgress(lessonId)
  );
}

function upsert(
  db: AppDatabase,
  lessonId: string,
  changes: Partial<Omit<LessonProgressRow, 'lessonId' | 'createdAt' | 'updatedAt'>>,
  now: number,
) {
  db.insert(lessonProgress)
    .values({ lessonId, ...changes, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: lessonProgress.lessonId, set: { ...changes, updatedAt: now } })
    .run();
}

/** Remembers the step reached, so the lesson reopens there. */
export function setLessonStep(db: AppDatabase, lessonId: string, step: number, now = Date.now()) {
  upsert(db, lessonId, { lastStep: z.number().int().min(0).parse(step) }, now);
}

const resultSchema = z
  .object({ correct: z.number().int().min(0), total: z.number().int().positive() })
  .refine((r) => r.correct <= r.total, 'More correct answers than questions');

/**
 * Records one run through the practice questions. Finishing them completes the
 * lesson (the first completion time is kept) and the best score is kept.
 */
export function recordPractice(
  db: AppDatabase,
  lessonId: string,
  result: { correct: number; total: number },
  now = Date.now(),
): void {
  const { correct, total } = resultSchema.parse(result);
  const current = getLessonProgress(db, lessonId);
  upsert(
    db,
    lessonId,
    {
      attempts: current.attempts + 1,
      completedAt: current.completedAt ?? now,
      bestScore: current.bestScore === null ? correct : Math.max(current.bestScore, correct),
      practiceTotal: total,
    },
    now,
  );
}

/** Starts a lesson over: progress is removed. */
export function resetLesson(db: AppDatabase, lessonId: string): void {
  db.delete(lessonProgress).where(eq(lessonProgress.lessonId, lessonId)).run();
}
