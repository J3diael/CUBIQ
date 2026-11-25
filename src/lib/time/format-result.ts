import type { Penalty } from '@/lib/timer/types';

import { formatDuration } from './format';

/** "12.345", "14.345+" for +2, "DNF(12.345)" when the raw time is shown, or "DNF". */
export function formatSolveTime(
  rawMs: number,
  penalty: Penalty,
  decimals: 2 | 3 = 3,
  options: { showRawForDnf?: boolean } = {},
): string {
  if (penalty === 'dnf') {
    return options.showRawForDnf ? `DNF(${formatDuration(rawMs, decimals)})` : 'DNF';
  }
  if (penalty === 'plus2') return `${formatDuration(rawMs + 2000, decimals)}+`;
  return formatDuration(rawMs, decimals);
}
