import { finalTimeMs } from '@/lib/timer/penalty';
import type { Penalty } from '@/lib/timer/types';

import { DNF, type FinalTimes, type StatValue } from './types';

export interface TimedSolve {
  rawTimeMs: number;
  penalty: Penalty;
}

/** Final time per solve in order, with DNF as Infinity. */
export function toFinalTimes(solves: readonly TimedSolve[]): number[] {
  return solves.map((s) => finalTimeMs(s.rawTimeMs, s.penalty) ?? DNF);
}

/**
 * How many of the fastest and slowest results an average of `n` drops on each side.
 * WCA averages of 5 drop 1 each side; longer averages drop 5% (rounded up), as most
 * cubing timers do: Ao12 drops 1, Ao50 drops 3, Ao100 drops 5.
 */
export function trimCount(n: number): number {
  return Math.ceil(n * 0.05);
}

/**
 * Average of a window of results with WCA rules: drop the best and worst `trimCount`,
 * then take the mean of the rest. DNFs count as the slowest results, so the average is
 * a DNF once there are more DNFs than dropped results.
 */
export function trimmedAverage(window: FinalTimes): StatValue {
  const n = window.length;
  if (n < 3) return null;
  const trim = trimCount(n);
  const sorted = [...window].sort((a, b) => a - b);
  const kept = sorted.slice(trim, n - trim);
  if (kept.some((t) => t === DNF)) return DNF;
  return Math.round(kept.reduce((sum, t) => sum + t, 0) / kept.length);
}

/** Mean of a window with no trimming (WCA mean of 3). Any DNF makes it a DNF. */
export function mean(window: FinalTimes): StatValue {
  if (window.length === 0) return null;
  if (window.some((t) => t === DNF)) return DNF;
  return Math.round(window.reduce((sum, t) => sum + t, 0) / window.length);
}

export type AverageKind = 'mo3' | 'ao5' | 'ao12' | 'ao50' | 'ao100';

export const AVERAGES: readonly { kind: AverageKind; size: number; label: string }[] = [
  { kind: 'mo3', size: 3, label: 'Mo3' },
  { kind: 'ao5', size: 5, label: 'Ao5' },
  { kind: 'ao12', size: 12, label: 'Ao12' },
  { kind: 'ao50', size: 50, label: 'Ao50' },
  { kind: 'ao100', size: 100, label: 'Ao100' },
];

function computeWindow(kind: AverageKind, window: FinalTimes): StatValue {
  return kind === 'mo3' ? mean(window) : trimmedAverage(window);
}

function sizeOf(kind: AverageKind): number {
  return AVERAGES.find((a) => a.kind === kind)!.size;
}

/** The average of the latest `size` results, or null if there are fewer. */
export function currentAverage(times: FinalTimes, kind: AverageKind): StatValue {
  const size = sizeOf(kind);
  if (times.length < size) return null;
  return computeWindow(kind, times.slice(-size));
}

/**
 * The average ending at every solve: entry i covers solves i-size+1..i, and is null
 * before there are enough solves. Used for best averages and trend lines.
 */
export function rollingAverages(times: FinalTimes, kind: AverageKind): StatValue[] {
  const size = sizeOf(kind);
  return times.map((_, i) =>
    i + 1 < size ? null : computeWindow(kind, times.slice(i + 1 - size, i + 1)),
  );
}

/** Best (lowest) value in a list, ignoring nulls. DNF only if every value is DNF. */
export function bestOf(values: readonly StatValue[]): StatValue {
  let best: StatValue = null;
  for (const v of values) {
    if (v !== null && (best === null || v < best)) best = v;
  }
  return best;
}

export function bestAverage(times: FinalTimes, kind: AverageKind): StatValue {
  return bestOf(rollingAverages(times, kind));
}
