import { formatDuration } from '@/lib/time/format';
import { startOfLocalDay } from '@/lib/time/date';

/** Short, readable target times: 20000 → "20", 15500 → "15.5", 75000 → "1:15". */
export function formatTarget(ms: number): string {
  return formatDuration(ms, 2).replace(/\.?0+$/, '');
}

const STAT_LABELS = { single: 'single', ao5: 'Ao5', ao12: 'Ao12' } as const;
const SET_LABELS: Record<string, string> = { f2l: 'F2L', oll: 'OLL', pll: 'PLL' };

export interface GoalTitleInput {
  type: 'solves' | 'time' | 'algorithms' | 'streak' | 'daily' | 'custom';
  target?: number | null;
  puzzleName?: string | null;
  stat?: 'single' | 'ao5' | 'ao12' | null;
  algorithmSet?: string | null;
}

/** A title for a goal when the user doesn't write one, e.g. "Sub-20 3x3 Ao5". */
export function defaultGoalTitle(g: GoalTitleInput): string {
  const puzzle = g.puzzleName ? `${g.puzzleName} ` : '';
  switch (g.type) {
    case 'solves':
      return `Complete ${g.target} ${puzzle}solves`;
    case 'time':
      return `Sub-${formatTarget(g.target ?? 0)} ${puzzle}${STAT_LABELS[g.stat ?? 'single']}`;
    case 'algorithms':
      return `Learn all ${SET_LABELS[g.algorithmSet ?? ''] ?? 'algorithms'}`;
    case 'streak':
      return `Practise ${g.target} days in a row`;
    case 'daily':
      return `${g.target} solves a day`;
    case 'custom':
      return 'My goal';
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Days in a row with at least one solve, counting back from today. A streak still
 * counts until the end of today if the last practice was yesterday.
 */
export function practiceStreak(solveTimes: readonly number[], now: number): number {
  const days = new Set(solveTimes.map((t) => startOfLocalDay(t)));
  let day = startOfLocalDay(now);
  if (!days.has(day)) day = startOfLocalDay(day - DAY_MS / 2);
  let streak = 0;
  while (days.has(day)) {
    streak++;
    // Half a day back, then snap to midnight: safe across daylight-saving changes.
    day = startOfLocalDay(day - DAY_MS / 2);
  }
  return streak;
}

export interface GoalProgress {
  current: number;
  target: number;
  /** 0 to 1, for a progress bar. */
  fraction: number;
  done: boolean;
  /** e.g. "37 of 100 solves". */
  text: string;
}

export function countProgress(current: number, target: number, unit: string): GoalProgress {
  return {
    current,
    target,
    fraction: target > 0 ? Math.min(1, current / target) : 0,
    done: current >= target,
    text: `${Math.min(current, target)} of ${target} ${unit}`,
  };
}

/**
 * A "sub-X" time goal: reached when the best result is strictly under the target.
 * The bar fills as the best result approaches the target.
 */
export function timeProgress(best: number | null, target: number, decimals: 2 | 3): GoalProgress {
  const valid = best !== null && Number.isFinite(best);
  return {
    current: valid ? best : 0,
    target,
    fraction: valid ? Math.min(1, target / best) : 0,
    done: valid && best < target,
    text: valid
      ? `Best ${formatDuration(best, decimals)} · target under ${formatTarget(target)}`
      : `No result yet · target under ${formatTarget(target)}`,
  };
}

/**
 * Reads a target time as people say it: "20" is 20 seconds, "15.5" is 15.5 seconds,
 * "1:30" is a minute and a half. Returns milliseconds, or null if it isn't a time.
 */
export function parseTargetTime(text: string): number | null {
  const match = /^\s*(?:(\d{1,2}):)?(\d{1,4})(?:\.(\d{1,3}))?\s*$/.exec(text);
  if (!match) return null;
  const [, minutes, seconds, fraction = ''] = match;
  if (minutes !== undefined && Number(seconds) >= 60) return null;
  const ms =
    Number(minutes ?? 0) * 60_000 + Number(seconds) * 1000 + Number(fraction.padEnd(3, '0'));
  return ms > 0 ? ms : null;
}
