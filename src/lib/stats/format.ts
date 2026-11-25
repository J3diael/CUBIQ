import { formatDuration } from '@/lib/time/format';

import { DNF, type StatValue } from './types';

/** "12.34", "DNF", or "—" when there aren't enough solves. */
export function formatStat(value: StatValue, decimals: 2 | 3 = 2): string {
  if (value === null) return '—';
  if (value === DNF) return 'DNF';
  return formatDuration(value, decimals);
}
