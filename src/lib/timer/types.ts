export type Penalty = 'none' | 'plus2' | 'dnf';

export interface SolveResult {
  /** Measured solve time in milliseconds, before any penalty. */
  rawMs: number;
  penalty: Penalty;
  /** Inspection time used, or null when inspection was off. */
  inspectionMs: number | null;
}
