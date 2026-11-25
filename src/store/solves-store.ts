import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';

import type { PuzzleId } from '@/constants/puzzles';
import type { Penalty } from '@/lib/timer/types';

export interface Solve {
  id: string;
  puzzleId: PuzzleId;
  /** The exact scramble shown for this solve. Empty only if the scramble engine was unavailable. */
  scramble: string;
  scrambleGeneratedAt: number | null;
  rawMs: number;
  penalty: Penalty;
  inspectionMs: number | null;
  /** The app was backgrounded during the solve; the time was corrected with the wall clock. */
  wasInterrupted: boolean;
  /** Epoch milliseconds. */
  solvedAt: number;
}

export type NewSolve = Omit<Solve, 'id'>;

/**
 * Solves recorded since the app started.
 * Phase 3 replaces this in-memory list with the SQLite solve repository, keeping the same shape.
 */
interface SolvesState {
  solves: Solve[];
  addSolve: (solve: NewSolve) => Solve;
  setPenalty: (id: string, penalty: Penalty) => void;
  deleteSolve: (id: string) => void;
}

export const useSolvesStore = create<SolvesState>()((set) => ({
  solves: [],
  addSolve: (input) => {
    const solve: Solve = { id: randomUUID(), ...input };
    set((state) => ({ solves: [...state.solves, solve] }));
    return solve;
  },
  setPenalty: (id, penalty) =>
    set((state) => ({ solves: state.solves.map((s) => (s.id === id ? { ...s, penalty } : s)) })),
  deleteSolve: (id) => set((state) => ({ solves: state.solves.filter((s) => s.id !== id) })),
}));
