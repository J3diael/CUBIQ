import { rollingAverages, toFinalTimes, type TimedSolve } from './averages';
import { DNF, type StatValue } from './types';

export interface TrendPoint extends Record<string, unknown> {
  /** Solve number in the session, from 1. */
  solve: number;
  /** Seconds; null for a DNF (drawn as a gap). */
  time: number | null;
  ao5: number | null;
  ao12: number | null;
}

const toSeconds = (v: StatValue) => (v === null || v === DNF ? null : v / 1000);

/** Every solve's time with the Ao5 and Ao12 that ended on it, for the trend chart. */
export function trendSeries(solves: readonly TimedSolve[]): TrendPoint[] {
  const times = toFinalTimes(solves);
  const ao5 = rollingAverages(times, 'ao5');
  const ao12 = rollingAverages(times, 'ao12');
  return times.map((t, i) => ({
    solve: i + 1,
    time: toSeconds(t),
    ao5: toSeconds(ao5[i] ?? null),
    ao12: toSeconds(ao12[i] ?? null),
  }));
}

export interface HistogramBucket extends Record<string, unknown> {
  /** Lower edge of the bucket in seconds. */
  from: number;
  /** Midpoint, used as the bar's position. */
  mid: number;
  count: number;
}

/**
 * Groups finished solves into buckets of a "nice" width (0.5 s, 1 s, 2 s, 5 s, ...)
 * so that there are at most `maxBuckets` bars. DNFs are left out.
 */
export function histogram(solves: readonly TimedSolve[], maxBuckets = 12): HistogramBucket[] {
  const seconds = toFinalTimes(solves)
    .filter((t) => t !== DNF)
    .map((t) => t / 1000);
  if (seconds.length === 0) return [];
  const min = Math.min(...seconds);
  const max = Math.max(...seconds);
  const widths = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  const width =
    widths.find((w) => Math.floor(max / w) - Math.floor(min / w) + 1 <= maxBuckets) ?? 600;
  const start = Math.floor(min / width) * width;
  const count = Math.floor(max / width) - Math.floor(min / width) + 1;
  const buckets: HistogramBucket[] = Array.from({ length: count }, (_, i) => {
    const from = round(start + i * width);
    return { from, mid: round(from + width / 2), count: 0 };
  });
  for (const s of seconds) {
    const index = Math.min(count - 1, Math.floor(s / width) - Math.floor(min / width));
    buckets[index]!.count += 1;
  }
  return buckets;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** The bucket width of a histogram, in seconds (0 for fewer than two buckets). */
export function bucketWidth(buckets: readonly HistogramBucket[]): number {
  return buckets.length >= 2 ? round(buckets[1]!.from - buckets[0]!.from) : 0;
}
