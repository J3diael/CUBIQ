import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { review, type Grade } from '@/lib/training/srs';
import { parseAlgorithm } from '@/lib/cube/notation';
import { newId } from '@/utils/id';

import type { AppDatabase } from '../client';
import {
  algorithmProgress,
  CUSTOM_ALGORITHM_SETS,
  customAlgorithms,
  type AlgorithmProgressRow,
  type CustomAlgorithmRow,
  type LearningStatus,
} from '../schema';

// ---------- Progress ----------

export type AlgorithmProgress = Omit<AlgorithmProgressRow, 'createdAt'>;

/** Progress for a case that has never been touched. */
export function emptyProgress(caseKey: string): AlgorithmProgress {
  return {
    caseKey,
    status: 'new',
    isFavorite: false,
    preferredAlgorithm: null,
    notes: null,
    ease: 2.5,
    intervalDays: 0,
    dueAt: null,
    reviews: 0,
    correct: 0,
    lapses: 0,
    lastReviewedAt: null,
    executions: 0,
    bestExecutionMs: null,
    lastExecutionMs: null,
    updatedAt: 0,
  };
}

export function getProgress(db: AppDatabase, caseKey: string): AlgorithmProgress {
  const row = db
    .select()
    .from(algorithmProgress)
    .where(eq(algorithmProgress.caseKey, caseKey))
    .get();
  return row ?? emptyProgress(caseKey);
}

/** Every case with progress, keyed by case key. Missing cases have no progress yet. */
export function listProgress(db: AppDatabase): Map<string, AlgorithmProgress> {
  return new Map(
    db
      .select()
      .from(algorithmProgress)
      .all()
      .map((row) => [row.caseKey, row]),
  );
}

/** Creates the row if needed, then applies the change. */
function upsert(
  db: AppDatabase,
  caseKey: string,
  changes: Partial<Omit<AlgorithmProgressRow, 'caseKey' | 'createdAt' | 'updatedAt'>>,
  now: number,
): void {
  db.insert(algorithmProgress)
    .values({ caseKey, ...changes, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: algorithmProgress.caseKey, set: { ...changes, updatedAt: now } })
    .run();
}

export function setStatus(
  db: AppDatabase,
  caseKey: string,
  status: LearningStatus,
  now = Date.now(),
) {
  upsert(db, caseKey, { status }, now);
}

export function setFavorite(
  db: AppDatabase,
  caseKey: string,
  isFavorite: boolean,
  now = Date.now(),
) {
  upsert(db, caseKey, { isFavorite }, now);
}

export function setPreferredAlgorithm(
  db: AppDatabase,
  caseKey: string,
  algorithm: string | null,
  now = Date.now(),
) {
  upsert(db, caseKey, { preferredAlgorithm: algorithm }, now);
}

export function setProgressNotes(
  db: AppDatabase,
  caseKey: string,
  notes: string,
  now = Date.now(),
) {
  const trimmed = notes.trim();
  upsert(db, caseKey, { notes: trimmed.length ? trimmed : null }, now);
}

/**
 * Records a flashcard answer and schedules the next review. A first review of a
 * new case also moves it to "learning".
 */
export function recordReview(db: AppDatabase, caseKey: string, grade: Grade, now = Date.now()) {
  const current = getProgress(db, caseKey);
  const next = review(current, grade, now);
  upsert(
    db,
    caseKey,
    {
      ...next,
      lastReviewedAt: now,
      status: current.status === 'new' ? 'learning' : current.status,
    },
    now,
  );
}

/** Records how long one execution of the algorithm took. */
export function recordExecution(db: AppDatabase, caseKey: string, ms: number, now = Date.now()) {
  z.number()
    .int()
    .positive()
    .max(10 * 60 * 1000)
    .parse(ms);
  const current = getProgress(db, caseKey);
  upsert(
    db,
    caseKey,
    {
      executions: current.executions + 1,
      lastExecutionMs: ms,
      bestExecutionMs:
        current.bestExecutionMs === null ? ms : Math.min(current.bestExecutionMs, ms),
    },
    now,
  );
}

export function resetProgress(db: AppDatabase, caseKey: string): void {
  db.delete(algorithmProgress).where(eq(algorithmProgress.caseKey, caseKey)).run();
}

// ---------- Custom algorithms ----------

export const algorithmTextSchema = z
  .string()
  .trim()
  .min(1, 'Enter the moves')
  .max(300, 'Keep it under 300 characters')
  .refine(
    (text) => {
      try {
        return parseAlgorithm(text).length > 0;
      } catch {
        return false;
      }
    },
    { message: 'Use standard notation, e.g. R U R’ U’' },
  )
  // Store the typographic prime as a plain apostrophe.
  .transform((text) => text.replace(/[’′]/g, "'").replace(/\s+/g, ' '));

export const customAlgorithmSchema = z.object({
  name: z.string().trim().min(1, 'Give it a name').max(60, 'Keep the name under 60 characters'),
  algorithm: z.preprocess(
    (v) => (typeof v === 'string' ? v.replace(/[’′]/g, "'") : v),
    algorithmTextSchema,
  ),
  set: z.enum(CUSTOM_ALGORITHM_SETS),
  caseId: z.string().nullable().default(null),
  collection: z
    .string()
    .trim()
    .max(40)
    .nullable()
    .default(null)
    .transform((v) => (v ? v : null)),
  notes: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .default(null)
    .transform((v) => (v ? v : null)),
});

export type CustomAlgorithmInput = z.input<typeof customAlgorithmSchema>;
export type CustomAlgorithm = Omit<CustomAlgorithmRow, 'deletedAt'>;

const live = isNull(customAlgorithms.deletedAt);
const strip = ({ deletedAt: _deleted, ...rest }: CustomAlgorithmRow): CustomAlgorithm => rest;

export function listCustomAlgorithms(db: AppDatabase): CustomAlgorithm[] {
  return db
    .select()
    .from(customAlgorithms)
    .where(live)
    .orderBy(asc(customAlgorithms.collection), asc(customAlgorithms.name))
    .all()
    .map(strip);
}

export function listCustomAlgorithmsForCase(db: AppDatabase, caseId: string): CustomAlgorithm[] {
  return db
    .select()
    .from(customAlgorithms)
    .where(and(live, eq(customAlgorithms.caseId, caseId)))
    .orderBy(asc(customAlgorithms.createdAt))
    .all()
    .map(strip);
}

export function getCustomAlgorithm(db: AppDatabase, id: string): CustomAlgorithm | null {
  const row = db
    .select()
    .from(customAlgorithms)
    .where(and(live, eq(customAlgorithms.id, id)))
    .get();
  return row ? strip(row) : null;
}

export function createCustomAlgorithm(
  db: AppDatabase,
  input: CustomAlgorithmInput,
  now = Date.now(),
): CustomAlgorithm {
  const data = customAlgorithmSchema.parse(input);
  const row = db
    .insert(customAlgorithms)
    .values({ id: newId(), ...data, createdAt: now, updatedAt: now })
    .returning()
    .get();
  return strip(row);
}

export function updateCustomAlgorithm(
  db: AppDatabase,
  id: string,
  input: CustomAlgorithmInput,
  now = Date.now(),
): void {
  const data = customAlgorithmSchema.parse(input);
  db.update(customAlgorithms)
    .set({ ...data, updatedAt: now })
    .where(eq(customAlgorithms.id, id))
    .run();
}

export function deleteCustomAlgorithm(db: AppDatabase, id: string, now = Date.now()): void {
  db.update(customAlgorithms)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(customAlgorithms.id, id))
    .run();
}

/** Progress key for a standalone custom algorithm. */
export const customCaseKey = (id: string) => `custom:${id}`;

/** Undo for `deleteCustomAlgorithm`. */
export function restoreCustomAlgorithm(db: AppDatabase, id: string, now = Date.now()): void {
  db.update(customAlgorithms)
    .set({ deletedAt: null, updatedAt: now })
    .where(eq(customAlgorithms.id, id))
    .run();
}
