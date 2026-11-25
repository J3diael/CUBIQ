import {
  bestAverage,
  currentAverage,
  mean,
  rollingAverages,
  toFinalTimes,
  trimCount,
  trimmedAverage,
} from '../averages';
import { DNF } from '../types';

const s = (sec: number) => Math.round(sec * 1000);

describe('toFinalTimes', () => {
  it('adds 2 s for +2 and turns DNF into Infinity', () => {
    expect(
      toFinalTimes([
        { rawTimeMs: 10_000, penalty: 'none' },
        { rawTimeMs: 10_000, penalty: 'plus2' },
        { rawTimeMs: 10_000, penalty: 'dnf' },
      ]),
    ).toEqual([10_000, 12_000, DNF]);
  });
});

describe('trimming', () => {
  it('drops 5% each side, rounded up', () => {
    expect([5, 12, 50, 100].map(trimCount)).toEqual([1, 1, 3, 5]);
  });

  it('computes a WCA average of 5', () => {
    // Drop 8.00 and 15.00, mean of 10, 11, 12.
    expect(trimmedAverage([s(10), s(8), s(15), s(11), s(12)])).toBe(s(11));
  });

  it('treats one DNF as the dropped worst result', () => {
    expect(trimmedAverage([s(10), s(8), DNF, s(11), s(12)])).toBe(s(11));
  });

  it('is a DNF with two DNFs in an average of 5', () => {
    expect(trimmedAverage([s(10), DNF, DNF, s(11), s(12)])).toBe(DNF);
  });

  it('rounds to the nearest millisecond', () => {
    expect(trimmedAverage([1, 1000, 1001, 1001, 5000])).toBe(1001);
    expect(trimmedAverage([0, 1, 1, 2, 9])).toBe(1);
  });

  it('allows up to one DNF in an Ao12 and three in an Ao50', () => {
    const twelve = Array.from({ length: 12 }, (_, i) => s(10 + i));
    expect(trimmedAverage([...twelve.slice(1), DNF])).not.toBe(DNF);
    expect(trimmedAverage([...twelve.slice(2), DNF, DNF])).toBe(DNF);
    const fifty = Array.from({ length: 50 }, () => s(10));
    expect(trimmedAverage([...fifty.slice(3), DNF, DNF, DNF])).toBe(s(10));
    expect(trimmedAverage([...fifty.slice(4), DNF, DNF, DNF, DNF])).toBe(DNF);
  });
});

describe('mean of 3', () => {
  it('uses every result and fails with any DNF', () => {
    expect(mean([s(10), s(11), s(12)])).toBe(s(11));
    expect(mean([s(10), DNF, s(12)])).toBe(DNF);
    expect(mean([])).toBeNull();
  });
});

describe('current, rolling and best averages', () => {
  const times = [s(12), s(10), s(14), s(9), s(11), s(20), s(8)];

  it('needs enough solves', () => {
    expect(currentAverage(times.slice(0, 4), 'ao5')).toBeNull();
    expect(currentAverage(times, 'ao12')).toBeNull();
  });

  it('averages the latest window', () => {
    // Last five: 14, 9, 11, 20, 8 → drop 8 and 20 → mean(14, 9, 11) = 11.333
    expect(currentAverage(times, 'ao5')).toBe(11_333);
    expect(currentAverage(times, 'mo3')).toBe(s(13));
  });

  it('has an average ending at each solve once there are enough', () => {
    const rolling = rollingAverages(times, 'ao5');
    expect(rolling.slice(0, 4)).toEqual([null, null, null, null]);
    expect(rolling[4]).toBe(11_000); // 12,10,14,9,11 → mean(12,10,11)
    expect(rolling).toHaveLength(times.length);
  });

  it('finds the best average across the session', () => {
    expect(bestAverage(times, 'ao5')).toBe(11_000);
    expect(bestAverage([s(1)], 'ao5')).toBeNull();
    expect(bestAverage([DNF, DNF, s(1), s(2), s(3)], 'ao5')).toBe(DNF);
  });
});
