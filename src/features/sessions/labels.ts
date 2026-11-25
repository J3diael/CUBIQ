import type { SessionPurpose, SolvingMethod } from '@/types/models';

export const METHOD_LABELS: Record<SolvingMethod, string> = {
  cfop: 'CFOP',
  roux: 'Roux',
  zz: 'ZZ',
  beginner: 'Beginner',
  other: 'Other method',
};

export const PURPOSE_LABELS: Record<SessionPurpose, string> = {
  daily: 'Daily practice',
  goal: 'Goal',
  competition: 'Competition prep',
  other: 'Other',
};
