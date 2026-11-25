import { formatSolveDate, startOfLocalDay } from '../date';

describe('dates', () => {
  const now = new Date(2026, 10, 25, 15, 30).getTime();

  it('finds local midnight', () => {
    expect(startOfLocalDay(now)).toBe(new Date(2026, 10, 25).getTime());
  });

  it('labels today and yesterday', () => {
    expect(formatSolveDate(new Date(2026, 10, 25, 9, 5).getTime(), now)).toMatch(/^Today, /);
    expect(formatSolveDate(new Date(2026, 10, 24, 23, 0).getTime(), now)).toMatch(/^Yesterday, /);
    expect(formatSolveDate(new Date(2026, 10, 2, 8, 0).getTime(), now)).toMatch(/2026/);
  });
});
