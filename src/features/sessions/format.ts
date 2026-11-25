import { formatDuration } from '@/lib/time/format';
import type { SessionSummary } from '@/types/models';

import { METHOD_LABELS, PURPOSE_LABELS } from './labels';

/** "12 solves · best 9.87 · CFOP" */
export function sessionSubtitle(session: SessionSummary): string {
  const parts = [`${session.solveCount} ${session.solveCount === 1 ? 'solve' : 'solves'}`];
  if (session.bestSingleMs !== null) parts.push(`best ${formatDuration(session.bestSingleMs, 2)}`);
  if (session.method) parts.push(METHOD_LABELS[session.method]);
  if (session.purpose) parts.push(PURPOSE_LABELS[session.purpose]);
  return parts.join(' · ');
}
