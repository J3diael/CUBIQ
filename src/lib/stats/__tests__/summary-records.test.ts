import { formatStat } from '../format';
import { computeRecords, newRecords } from '../records';
import { computeSessionStats } from '../summary';
import { DNF } from '../types';

const solve = (sec: number, penalty: 'none' | 'plus2' | 'dnf' = 'none') => ({
  rawTimeMs: Math.round(sec * 1000),
  penalty,
});

describe('computeSessionStats', () => {
  it('summarises an empty session', () => {
    const stats = computeSessionStats([]);
    expect(stats).toMatchObject({ count: 0, dnfCount: 0, bestSingle: null, mean: null });
    expect(stats.averages.ao5).toEqual({ current: null, best: null });
  });

  it('summarises solves with penalties', () => {
    const stats = computeSessionStats([
      solve(10),
      solve(12),
      solve(8, 'plus2'),
      solve(5, 'dnf'),
      solve(14),
    ]);
    expect(stats).toMatchObject({
      count: 5,
      dnfCount: 1,
      bestSingle: 10_000,
      worstSingle: 14_000,
      mean: 11_500,
      standardDeviation: 1915,
    });
    // 10, 12, 10, DNF, 14 → drop 10 and DNF → mean(12, 10, 14) = 12
    expect(stats.averages.ao5).toEqual({ current: 12_000, best: 12_000 });
    expect(stats.averages.mo3).toEqual({ current: DNF, best: 10_667 });
  });
});

describe('records', () => {
  it('takes the best single and averages across sessions, never mixing sessions in an average', () => {
    const a = [solve(10), solve(10), solve(10), solve(10), solve(10)];
    const b = [solve(9), solve(20), solve(20), solve(20)];
    const records = computeRecords([a, b]);
    expect(records).toEqual({ single: 9000, ao5: 10_000, ao12: null, ao100: null });
  });

  it('reports only improvements over an existing record', () => {
    const before = { single: 10_000, ao5: 12_000, ao12: null, ao100: null };
    expect(newRecords(before, { single: 9_000, ao5: 12_000, ao12: 11_000, ao100: null })).toEqual([
      'single',
    ]);
    expect(newRecords(before, { ...before, ao5: 11_000 })).toEqual(['ao5']);
    expect(newRecords({ single: null, ao5: null, ao12: null, ao100: null }, before)).toEqual([]);
  });
});

describe('formatStat', () => {
  it('formats times, DNF and missing values', () => {
    expect(formatStat(11_333)).toBe('11.33');
    expect(formatStat(11_333, 3)).toBe('11.333');
    expect(formatStat(DNF)).toBe('DNF');
    expect(formatStat(null)).toBe('—');
  });
});
