import type { PuzzleId } from '@/constants/puzzles';
import type { AppDatabase } from '@/database/client';
import { listSolvesBySession } from '@/database/repositories/solves-repository';
import { computeRecords, type PersonalRecords } from '@/lib/stats';

/** Personal bests for a puzzle, computed from every live session. */
export function getPersonalRecords(db: AppDatabase, puzzleId: PuzzleId): PersonalRecords {
  return computeRecords(listSolvesBySession(db, puzzleId));
}
