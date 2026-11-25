import { finalTimeMs } from '@/lib/timer/penalty';

import { formatSolveTime } from '../format-result';

describe('formatSolveTime', () => {
  it('formats normal, +2 and DNF results', () => {
    expect(formatSolveTime(9874, 'none')).toBe('9.874');
    expect(formatSolveTime(9874, 'plus2')).toBe('11.874+');
    expect(formatSolveTime(9874, 'dnf')).toBe('DNF');
    expect(formatSolveTime(9874, 'dnf', 3, { showRawForDnf: true })).toBe('DNF(9.874)');
  });

  it('respects two-decimal display', () => {
    expect(formatSolveTime(9879, 'none', 2)).toBe('9.87');
  });
});

describe('finalTimeMs', () => {
  it('adds 2 s for +2 and returns null for DNF', () => {
    expect(finalTimeMs(10_000, 'none')).toBe(10_000);
    expect(finalTimeMs(10_000, 'plus2')).toBe(12_000);
    expect(finalTimeMs(10_000, 'dnf')).toBeNull();
  });
});
