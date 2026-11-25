import { bucketWidth, histogram, trendSeries } from '../chart-data';

const solve = (sec: number, penalty: 'none' | 'plus2' | 'dnf' = 'none') => ({
  rawTimeMs: Math.round(sec * 1000),
  penalty,
});

describe('trendSeries', () => {
  it('gives each solve its time in seconds, a gap for DNF, and the averages so far', () => {
    const points = trendSeries([
      solve(10),
      solve(12),
      solve(5, 'dnf'),
      solve(11),
      solve(9, 'plus2'),
    ]);
    expect(points.map((p) => p.time)).toEqual([10, 12, null, 11, 11]);
    expect(points[3]?.ao5).toBeNull();
    expect(points[4]).toMatchObject({ solve: 5, ao5: 11.333, ao12: null });
  });
});

describe('histogram', () => {
  it('is empty without finished solves', () => {
    expect(histogram([])).toEqual([]);
    expect(histogram([solve(10, 'dnf')])).toEqual([]);
  });

  it('picks a nice bucket width and counts every finished solve', () => {
    const solves = [9.1, 9.8, 10.2, 10.4, 11.9, 13.5, 20.1].map((s) => solve(s));
    const buckets = histogram(solves, 12);
    expect(bucketWidth(buckets)).toBe(1);
    expect(buckets[0]).toMatchObject({ from: 9, count: 2 });
    expect(buckets.reduce((n, b) => n + b.count, 0)).toBe(7);
    expect(buckets.at(-1)).toMatchObject({ from: 20, count: 1 });
  });

  it('uses narrow buckets for close times', () => {
    const buckets = histogram([10.0, 10.1, 10.45].map((s) => solve(s)));
    expect(bucketWidth(buckets)).toBe(0.1);
  });
});
