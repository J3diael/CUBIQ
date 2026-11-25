import { bestSingleMs, dnfCount, meanExcludingDnfMs } from '../simple';

const solves = [
  { rawTimeMs: 10_000, penalty: 'none' as const },
  { rawTimeMs: 9_000, penalty: 'plus2' as const },
  { rawTimeMs: 5_000, penalty: 'dnf' as const },
  { rawTimeMs: 12_000, penalty: 'none' as const },
];

describe('simple stats', () => {
  it('finds the best final time, counting +2 and ignoring DNF', () => {
    expect(bestSingleMs(solves)).toBe(10_000);
    expect(bestSingleMs([])).toBeNull();
    expect(bestSingleMs([{ rawTimeMs: 1, penalty: 'dnf' }])).toBeNull();
  });

  it('averages finished solves only', () => {
    expect(meanExcludingDnfMs(solves)).toBe(11_000);
    expect(meanExcludingDnfMs([])).toBeNull();
  });

  it('counts DNFs', () => {
    expect(dnfCount(solves)).toBe(1);
  });
});
