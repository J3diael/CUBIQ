import {
  AVERAGES,
  bestAverage,
  bestOf,
  currentAverage,
  toFinalTimes,
  type AverageKind,
  type TimedSolve,
} from './averages';
import { DNF, type StatValue } from './types';

export interface AverageSummary {
  current: StatValue;
  best: StatValue;
}

/** Everything the session statistics screen shows. Computed on demand, never stored. */
export interface SessionStats {
  count: number;
  dnfCount: number;
  bestSingle: StatValue;
  worstSingle: StatValue;
  /** Mean of finished solves (DNFs left out). */
  mean: StatValue;
  /** Standard deviation of finished solves: how consistent the times are. */
  standardDeviation: StatValue;
  averages: Record<AverageKind, AverageSummary>;
}

export function computeSessionStats(solves: readonly TimedSolve[]): SessionStats {
  const times = toFinalTimes(solves);
  const finished = times.filter((t) => t !== DNF);
  const averages = Object.fromEntries(
    AVERAGES.map(({ kind }) => [
      kind,
      { current: currentAverage(times, kind), best: bestAverage(times, kind) },
    ]),
  ) as Record<AverageKind, AverageSummary>;

  let meanMs: StatValue = null;
  let sd: StatValue = null;
  if (finished.length) {
    const m = finished.reduce((s, t) => s + t, 0) / finished.length;
    meanMs = Math.round(m);
    if (finished.length >= 2) {
      const variance = finished.reduce((s, t) => s + (t - m) ** 2, 0) / (finished.length - 1);
      sd = Math.round(Math.sqrt(variance));
    }
  }

  return {
    count: times.length,
    dnfCount: times.length - finished.length,
    bestSingle: bestOf(times),
    worstSingle: finished.length ? Math.max(...finished) : times.length ? DNF : null,
    mean: meanMs,
    standardDeviation: sd,
    averages,
  };
}
