import type { Penalty } from './types';

/** WCA regulation A4b1: up to 2 seconds over inspection is +2, beyond that is DNF. */
export const INSPECTION_GRACE_MS = 2000;

/** Penalty earned by starting the solve after `elapsedMs` of inspection. */
export function inspectionPenalty(elapsedMs: number, durationMs: number): Penalty {
  if (elapsedMs <= durationMs) return 'none';
  if (elapsedMs <= durationMs + INSPECTION_GRACE_MS) return 'plus2';
  return 'dnf';
}

export type InspectionPhase =
  { kind: 'counting'; secondsLeft: number } | { kind: 'plus2' } | { kind: 'dnf' };

/** What the inspection display should show after `elapsedMs`. */
export function inspectionPhase(elapsedMs: number, durationMs: number): InspectionPhase {
  const penalty = inspectionPenalty(elapsedMs, durationMs);
  if (penalty === 'plus2') return { kind: 'plus2' };
  if (penalty === 'dnf') return { kind: 'dnf' };
  return { kind: 'counting', secondsLeft: Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000)) };
}

/** Elapsed times at which WCA judges call out "8 seconds" and "12 seconds" for 15-second inspection. */
export function inspectionWarningsMs(durationMs: number): number[] {
  return [durationMs - 7000, durationMs - 3000].filter((ms) => ms > 0);
}
