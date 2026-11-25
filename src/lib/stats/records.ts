import { bestAverage, bestOf, toFinalTimes, type TimedSolve } from './averages';
import type { StatValue } from './types';

/** Personal bests for one puzzle. Averages count only solves within the same session. */
export interface PersonalRecords {
  single: StatValue;
  ao5: StatValue;
  ao12: StatValue;
  ao100: StatValue;
}

export type RecordKind = keyof PersonalRecords;

export const RECORD_LABELS: Record<RecordKind, string> = {
  single: 'single',
  ao5: 'Ao5',
  ao12: 'Ao12',
  ao100: 'Ao100',
};

/** `sessions` holds each session's solves in solve order. */
export function computeRecords(sessions: readonly (readonly TimedSolve[])[]): PersonalRecords {
  const perSession = sessions.map((solves) => {
    const times = toFinalTimes(solves);
    return {
      single: bestOf(times),
      ao5: bestAverage(times, 'ao5'),
      ao12: bestAverage(times, 'ao12'),
      ao100: bestAverage(times, 'ao100'),
    };
  });
  const best = (key: RecordKind) => bestOf(perSession.map((s) => s[key]));
  return { single: best('single'), ao5: best('ao5'), ao12: best('ao12'), ao100: best('ao100') };
}

/**
 * Records that improved from `before` to `after`. A first result counts as a record
 * only when there was a previous value to beat, so the very first solve isn't a "PB".
 * DNF averages are never records.
 */
export function newRecords(before: PersonalRecords, after: PersonalRecords): RecordKind[] {
  return (Object.keys(after) as RecordKind[]).filter((key) => {
    const was = before[key];
    const now = after[key];
    return was !== null && now !== null && Number.isFinite(now) && now < was;
  });
}
