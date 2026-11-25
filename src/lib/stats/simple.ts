import { finalTimeMs } from '@/lib/timer/penalty';
import type { Penalty } from '@/lib/timer/types';

/**
 * Basic numbers for a list of solves. The full statistics engine (averages of N
 * with WCA trimming, records, trends) arrives in Phase 4.
 */
export interface TimedSolve {
  rawTimeMs: number;
  penalty: Penalty;
}

/** Fastest final time, ignoring DNFs. */
export function bestSingleMs(solves: readonly TimedSolve[]): number | null {
  let best: number | null = null;
  for (const solve of solves) {
    const time = finalTimeMs(solve.rawTimeMs, solve.penalty);
    if (time !== null && (best === null || time < best)) best = time;
  }
  return best;
}

/** Plain mean of final times, leaving out DNFs. Null when there are no finished solves. */
export function meanExcludingDnfMs(solves: readonly TimedSolve[]): number | null {
  let total = 0;
  let count = 0;
  for (const solve of solves) {
    const time = finalTimeMs(solve.rawTimeMs, solve.penalty);
    if (time === null) continue;
    total += time;
    count += 1;
  }
  return count ? Math.round(total / count) : null;
}

export function dnfCount(solves: readonly TimedSolve[]): number {
  return solves.filter((s) => s.penalty === 'dnf').length;
}
