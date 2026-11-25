import { ListRow } from '@/components/ui';
import { formatSolveDate } from '@/lib/time/date';
import { formatSolveTime } from '@/lib/time/format-result';
import type { Solve } from '@/types/models';

interface SolveRowProps {
  solve: Solve;
  decimals: 2 | 3;
  /** Extra context after the date, such as the session name. */
  detail?: string;
  /** Position in the session, shown as "#12". */
  index?: number;
  onPress: () => void;
}

export function SolveRow({ solve, decimals, detail, index, onPress }: SolveRowProps) {
  const time = formatSolveTime(solve.rawTimeMs, solve.penalty, decimals, {
    showRawForDnf: solve.rawTimeMs > 0,
  });
  const parts = [formatSolveDate(solve.solvedAt)];
  if (detail) parts.push(detail);
  if (solve.source === 'manual') parts.push('Typed in');
  if (solve.notes) parts.push('Note');
  return (
    <ListRow
      title={index !== undefined ? `#${index} · ${time}` : time}
      subtitle={parts.join(' · ')}
      onPress={onPress}
    />
  );
}
