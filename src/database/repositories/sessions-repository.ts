import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { PUZZLES, type PuzzleId } from '@/constants/puzzles';
import type { Session, SessionSummary } from '@/types/models';
import { newId } from '@/utils/id';

import type { AppDatabase } from '../client';
import { sessions, SESSION_PURPOSES, SOLVING_METHODS, solves, type SessionRow } from '../schema';

export const sessionNameSchema = z
  .string()
  .trim()
  .min(1, 'Give the session a name')
  .max(40, 'Keep the name under 40 characters');

export const newSessionSchema = z.object({
  name: sessionNameSchema,
  puzzleId: z.enum(Object.keys(PUZZLES) as [PuzzleId, ...PuzzleId[]]),
  method: z.enum(SOLVING_METHODS).nullable().default(null),
  purpose: z.enum(SESSION_PURPOSES).nullable().default(null),
});

export type NewSessionInput = z.input<typeof newSessionSchema>;

export function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    name: row.name,
    puzzleId: row.puzzleId as PuzzleId,
    method: row.method,
    purpose: row.purpose,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Final time for statistics in SQL: +2 adds 2000 ms, DNF has no time. */
const finalTimeSql = sql`case ${solves.penalty} when 'dnf' then null when 'plus2' then ${solves.rawTimeMs} + 2000 else ${solves.rawTimeMs} end`;

export function listSessions(db: AppDatabase): SessionSummary[] {
  const rows = db
    .select({
      session: sessions,
      solveCount: sql<number>`count(${solves.id})`,
      bestSingleMs: sql<number | null>`min(${finalTimeSql})`,
      lastSolvedAt: sql<number | null>`max(${solves.solvedAt})`,
    })
    .from(sessions)
    .leftJoin(solves, and(eq(solves.sessionId, sessions.id), isNull(solves.deletedAt)))
    .where(isNull(sessions.deletedAt))
    .groupBy(sessions.id)
    .orderBy(desc(sessions.updatedAt))
    .all();

  return rows.map((row) => ({
    ...toSession(row.session),
    solveCount: Number(row.solveCount),
    bestSingleMs: row.bestSingleMs === null ? null : Number(row.bestSingleMs),
    lastSolvedAt: row.lastSolvedAt === null ? null : Number(row.lastSolvedAt),
  }));
}

export function getSession(db: AppDatabase, id: string): Session | null {
  const row = db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), isNull(sessions.deletedAt)))
    .get();
  return row ? toSession(row) : null;
}

export function createSession(db: AppDatabase, input: NewSessionInput, now = Date.now()): Session {
  const data = newSessionSchema.parse(input);
  const row = db
    .insert(sessions)
    .values({ id: newId(), ...data, createdAt: now, updatedAt: now })
    .returning()
    .get();
  return toSession(row);
}

export function renameSession(db: AppDatabase, id: string, name: string, now = Date.now()): void {
  const parsed = sessionNameSchema.parse(name);
  db.update(sessions).set({ name: parsed, updatedAt: now }).where(eq(sessions.id, id)).run();
}

/** Marks the session as recently used, so it sorts first. */
export function touchSession(db: AppDatabase, id: string, now = Date.now()): void {
  db.update(sessions).set({ updatedAt: now }).where(eq(sessions.id, id)).run();
}

/**
 * Soft-deletes a session and its solves together. Rows stay in the database
 * (for undo and future sync) but disappear from every query.
 */
export function deleteSession(db: AppDatabase, id: string, now = Date.now()): void {
  db.transaction((tx) => {
    tx.update(solves)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(solves.sessionId, id), isNull(solves.deletedAt)))
      .run();
    tx.update(sessions).set({ deletedAt: now, updatedAt: now }).where(eq(sessions.id, id)).run();
  });
}
