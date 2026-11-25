import {
  countProgress,
  defaultGoalTitle,
  formatTarget,
  parseTargetTime,
  practiceStreak,
  timeProgress,
} from '../goals';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

describe('target times', () => {
  it('reads times the way people say them', () => {
    expect(parseTargetTime('20')).toBe(20_000);
    expect(parseTargetTime('15.5')).toBe(15_500);
    expect(parseTargetTime('1:30')).toBe(90_000);
    expect(parseTargetTime(' 9.87 ')).toBe(9_870);
    for (const bad of ['', '0', 'abc', '1:75', '20s', '-3'])
      expect(parseTargetTime(bad)).toBeNull();
  });

  it('formats them back without trailing zeros', () => {
    expect(formatTarget(20_000)).toBe('20');
    expect(formatTarget(15_500)).toBe('15.5');
    expect(formatTarget(90_000)).toBe('1:30');
  });
});

describe('default titles', () => {
  it('describes each kind of goal', () => {
    expect(defaultGoalTitle({ type: 'time', target: 20_000, puzzleName: '3x3', stat: 'ao5' })).toBe(
      'Sub-20 3x3 Ao5',
    );
    expect(defaultGoalTitle({ type: 'solves', target: 100 })).toBe('Complete 100 solves');
    expect(defaultGoalTitle({ type: 'algorithms', algorithmSet: 'pll' })).toBe('Learn all PLL');
    expect(defaultGoalTitle({ type: 'streak', target: 7 })).toBe('Practise 7 days in a row');
    expect(defaultGoalTitle({ type: 'daily', target: 25 })).toBe('25 solves a day');
  });
});

describe('practice streak', () => {
  const now = at(2026, 11, 25, 9);

  it('counts days in a row ending today', () => {
    expect(practiceStreak([at(2026, 11, 25, 8), at(2026, 11, 24), at(2026, 11, 23)], now)).toBe(3);
  });

  it('still counts a streak whose last practice was yesterday', () => {
    expect(practiceStreak([at(2026, 11, 24), at(2026, 11, 23)], now)).toBe(2);
  });

  it('breaks on a missed day and counts several solves a day once', () => {
    expect(practiceStreak([at(2026, 11, 25), at(2026, 11, 25, 20), at(2026, 11, 23)], now)).toBe(1);
    expect(practiceStreak([at(2026, 11, 22)], now)).toBe(0);
    expect(practiceStreak([], now)).toBe(0);
  });

  it('works across a daylight-saving change', () => {
    // Late March and late October include 23- and 25-hour days in many time zones.
    const days = Array.from({ length: 10 }, (_, i) => at(2026, 3, 22 + i));
    expect(practiceStreak(days, at(2026, 3, 31, 18))).toBe(10);
  });
});

describe('progress', () => {
  it('fills up for counts and completes at the target', () => {
    expect(countProgress(37, 100, 'solves')).toMatchObject({
      fraction: 0.37,
      done: false,
      text: '37 of 100 solves',
    });
    expect(countProgress(120, 100, 'solves')).toMatchObject({
      fraction: 1,
      done: true,
      text: '100 of 100 solves',
    });
  });

  it('needs a best strictly under the target for sub-X goals', () => {
    expect(timeProgress(20_000, 20_000, 2).done).toBe(false);
    expect(timeProgress(19_990, 20_000, 2)).toMatchObject({ done: true, fraction: 1 });
    expect(timeProgress(25_000, 20_000, 2)).toMatchObject({
      done: false,
      fraction: 0.8,
      text: 'Best 25.00 · target under 20',
    });
    expect(timeProgress(null, 20_000, 2)).toMatchObject({ done: false, fraction: 0 });
    expect(timeProgress(Infinity, 20_000, 2).done).toBe(false);
  });
});
