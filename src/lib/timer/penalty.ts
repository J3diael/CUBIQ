import type { Penalty } from './types';

export const PLUS_TWO_MS = 2000;

/**
 * Time that counts for statistics: raw + 2 s for +2, and null for DNF
 * (statistics treat DNF as slower than any time).
 */
export function finalTimeMs(rawMs: number, penalty: Penalty): number | null {
  if (penalty === 'dnf') return null;
  return penalty === 'plus2' ? rawMs + PLUS_TWO_MS : rawMs;
}
