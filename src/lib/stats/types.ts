/**
 * A statistic's value: milliseconds, `DNF` (a failed average), or `null` when
 * there are not enough solves yet. DNF is Infinity so it sorts after every time.
 */
export const DNF = Number.POSITIVE_INFINITY;
export type StatValue = number | null;

export function isDnf(value: StatValue): boolean {
  return value === DNF;
}

/** Final times in solve order: milliseconds, or DNF (Infinity). */
export type FinalTimes = readonly number[];
