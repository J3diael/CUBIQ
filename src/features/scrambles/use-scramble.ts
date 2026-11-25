import { useCallback, useEffect, useRef, useState } from 'react';

import type { PuzzleId } from '@/constants/puzzles';

import type { Scramble } from './scramble-queue';
import { scrambleQueue } from './scramble-service';

export type ScrambleState =
  | { status: 'loading'; scramble: null }
  | { status: 'ready'; scramble: Scramble }
  | { status: 'error'; scramble: null; message: string };

/**
 * The scramble currently shown for a puzzle. `next()` replaces it with a fresh one
 * (after a solve, or when the user asks for a new scramble). A scramble is never
 * reused once replaced.
 */
export function useScramble(puzzleId: PuzzleId) {
  const [state, setState] = useState<ScrambleState>({ status: 'loading', scramble: null });
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    scrambleQueue.take(puzzleId).then(
      (scramble) => {
        if (id === requestId.current) setState({ status: 'ready', scramble });
      },
      (error: unknown) => {
        if (id === requestId.current) {
          setState({
            status: 'error',
            scramble: null,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      },
    );
  }, [puzzleId]);

  const next = useCallback(() => {
    setState({ status: 'loading', scramble: null });
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, next };
}
