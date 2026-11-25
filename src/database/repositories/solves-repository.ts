import { and, asc, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import type { PuzzleId } from '@/constants/puzzles';
import type { Penalty } from '@/lib/timer/types';
import type { Solve } from '@/types/models';
import { newId } from '@/utils/id';

import type { AppDatabase } from '../client';
import { PENALTIES, sessions, solves, type SolveRow } from '../schema';
import { touchSession } from './sessions-repository';

export const newSolveSchema = z.object({
  sessionId: z.string().min(1),
  puzzleId: z.string().min(1),
  scramble: z.string(),
  scrambleGeneratedAt: z.number().int().nullable().default(null),
  rawTimeMs: z
    .number()
    .int()
    .nonnegative()
    .max(24 * 60 * 60 * 1000),
  penalty: z.enum(PENALTIES).default('none'),
  inspectionMs: z.number().int().nonnegative().nullable().default(null),
  source: z.enum(['timer', 'manual']).default('timer'),
  wasInterrupted: z.boolean().default(false),
  notes: z.string().nullable().default(null),
  solvedAt: z.number().int(),
});

export type NewSolveInput = z.input<typeof newSolveSchema>;

export function toSolve(row: SolveRow): Solve {
  return {
    id: row.id,
    sessionId: row.sessionId,
    puzzleId: row.puzzleId as PuzzleId,
    scramble: row.scramble,
    scrambleGeneratedAt: row.scrambleGeneratedAt,
    rawTimeMs: row.rawTimeMs,
    penalty: row.penalty,
    inspectionMs: row.inspectionMs,
    source: row.source,
    wasInterrupted: row.wasInterrupted,
    notes: row.notes,
    solvedAt: row.solvedAt,
  };
}

const notDeleted = isNull(solves.deletedAt);

export function addSolve(db: AppDatabase, input: NewSolveInput, now = Date.now()): Solve {
  const data = newSolveSchema.parse(input);
  const row = db.transaction((tx) => {
    const inserted = tx
      .insert(solves)
      .values({ id: newId(), ...data, createdAt: now, updatedAt: now })
      .returning()
      .get();
    touchSession(tx as unknown as AppDatabase, data.sessionId, now);
    return inserted;
  });
  return toSolve(row);
}

/** Solves in a session, oldest first (the order statistics need). */
export function listSolves(db: AppDatabase, sessionId: string): Solve[] {
  return db
    .select()
    .from(solves)
    .where(and(eq(solves.sessionId, sessionId), notDeleted))
    .orderBy(asc(solves.solvedAt), asc(solves.createdAt))
    .all()
    .map(toSolve);
}

export function getSolve(db: AppDatabase, id: string): Solve | null {
  const row = db
    .select()
    .from(solves)
    .where(and(eq(solves.id, id), notDeleted))
    .get();
  return row ? toSolve(row) : null;
}

export function setPenalty(db: AppDatabase, id: string, penalty: Penalty, now = Date.now()): void {
  z.enum(PENALTIES).parse(penalty);
  db.update(solves).set({ penalty, updatedAt: now }).where(eq(solves.id, id)).run();
}

export function setNotes(db: AppDatabase, id: string, notes: string, now = Date.now()): void {
  const trimmed = notes.trim();
  db.update(solves)
    .set({ notes: trimmed.length ? trimmed : null, updatedAt: now })
    .where(eq(solves.id, id))
    .run();
}

export function deleteSolve(db: AppDatabase, id: string, now = Date.now()): void {
  db.update(solves).set({ deletedAt: now, updatedAt: now }).where(eq(solves.id, id)).run();
}

/** Undo for `deleteSolve`. */
export function restoreSolve(db: AppDatabase, id: string, now = Date.now()): void {
  db.update(solves).set({ deletedAt: null, updatedAt: now }).where(eq(solves.id, id)).run();
}

/** Number of solves across live sessions, optionally only since a time. */
export function countSolves(db: AppDatabase, options: { since?: number } = {}): number {
  const row = db
    .select({ n: sql<number>`count(*)` })
    .from(solves)
    .innerJoin(sessions, and(eq(sessions.id, solves.sessionId), isNull(sessions.deletedAt)))
    .where(
      and(
        notDeleted,
        options.since !== undefined ? gte(solves.solvedAt, options.since) : undefined,
      ),
    )
    .get();
  return Number(row?.n ?? 0);
}

export interface RecentSolve extends Solve {
  sessionName: string;
}

export function recentSolves(db: AppDatabase, limit = 5): RecentSolve[] {
  return db
    .select({ solve: solves, sessionName: sessions.name })
    .from(solves)
    .innerJoin(sessions, and(eq(sessions.id, solves.sessionId), isNull(sessions.deletedAt)))
    .where(notDeleted)
    .orderBy(desc(solves.solvedAt))
    .limit(limit)
    .all()
    .map((row) => ({ ...toSolve(row.solve), sessionName: row.sessionName }));
}

/** Best non-DNF final time for a puzzle across all live sessions. */
export function bestSingle(db: AppDatabase, puzzleId: PuzzleId): number | null {
  const row = db
    .select({
      best: sql<
        number | null
      >`min(case ${solves.penalty} when 'dnf' then null when 'plus2' then ${solves.rawTimeMs} + 2000 else ${solves.rawTimeMs} end)`,
    })
    .from(solves)
    .innerJoin(sessions, and(eq(sessions.id, solves.sessionId), isNull(sessions.deletedAt)))
    .where(and(notDeleted, eq(solves.puzzleId, puzzleId)))
    .get();
  return row?.best === null || row?.best === undefined ? null : Number(row.best);
}

/**
 * Every live solve of a puzzle, grouped by session (each group oldest first).
 * Personal-best averages are computed per session, so they never span two sessions.
 */
export function listSolvesBySession(db: AppDatabase, puzzleId: PuzzleId): Solve[][] {
  const rows = db
    .select({ solve: solves })
    .from(solves)
    .innerJoin(sessions, and(eq(sessions.id, solves.sessionId), isNull(sessions.deletedAt)))
    .where(and(notDeleted, eq(solves.puzzleId, puzzleId)))
    .orderBy(asc(solves.sessionId), asc(solves.solvedAt), asc(solves.createdAt))
    .all();
  const groups = new Map<string, Solve[]>();
  for (const { solve } of rows) {
    const list = groups.get(solve.sessionId) ?? [];
    list.push(toSolve(solve));
    groups.set(solve.sessionId, list);
  }
  return [...groups.values()];
}
