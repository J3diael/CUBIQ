import { asc, eq } from 'drizzle-orm';

import type { PuzzleId } from '@/constants/puzzles';
import type { Scramble } from '@/features/scrambles/scramble-queue';

import type { AppDatabase } from '../client';
import { scrambleQueue } from '../schema';

export function listQueuedScrambles(db: AppDatabase, puzzleId: PuzzleId): Scramble[] {
  return db
    .select()
    .from(scrambleQueue)
    .where(eq(scrambleQueue.puzzleId, puzzleId))
    .orderBy(asc(scrambleQueue.generatedAt))
    .all()
    .map((row) => ({
      id: row.id,
      puzzleId: row.puzzleId as PuzzleId,
      notation: row.scramble,
      generatedAt: row.generatedAt,
    }));
}

export function addQueuedScramble(db: AppDatabase, scramble: Scramble): void {
  db.insert(scrambleQueue)
    .values({
      id: scramble.id,
      puzzleId: scramble.puzzleId,
      scramble: scramble.notation,
      generatedAt: scramble.generatedAt,
    })
    .onConflictDoNothing()
    .run();
}

export function removeQueuedScramble(db: AppDatabase, id: string): void {
  db.delete(scrambleQueue).where(eq(scrambleQueue.id, id)).run();
}
