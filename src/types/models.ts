import type { PuzzleId } from '@/constants/puzzles';
import type { SessionPurpose, SolvingMethod } from '@/database/schema/sessions';
import type { Penalty } from '@/lib/timer/types';

export type { SessionPurpose, SolvingMethod };

export interface Solve {
  id: string;
  sessionId: string;
  puzzleId: PuzzleId;
  /** The exact scramble shown for this solve. Empty only if no scramble was available. */
  scramble: string;
  scrambleGeneratedAt: number | null;
  rawTimeMs: number;
  penalty: Penalty;
  inspectionMs: number | null;
  source: 'timer' | 'manual';
  /** The app was backgrounded during the solve. */
  wasInterrupted: boolean;
  notes: string | null;
  /** Epoch milliseconds. */
  solvedAt: number;
}

export interface Session {
  id: string;
  name: string;
  puzzleId: PuzzleId;
  method: SolvingMethod | null;
  purpose: SessionPurpose | null;
  createdAt: number;
  updatedAt: number;
}

/** A session plus numbers calculated from its solves (never stored). */
export interface SessionSummary extends Session {
  solveCount: number;
  /** Best final time in ms, ignoring DNFs; null when there is none. */
  bestSingleMs: number | null;
  lastSolvedAt: number | null;
}
