import { formatDuration } from '../format';

describe('formatDuration', () => {
  it.each([
    [0, '0.000'],
    [9874, '9.874'],
    [59_999, '59.999'],
    [60_000, '1:00.000'],
    [62_345, '1:02.345'],
    [3_600_000, '1:00:00.000'],
    [3_723_004, '1:02:03.004'],
  ])('formats %d ms as %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });

  it('truncates instead of rounding at two decimals', () => {
    expect(formatDuration(9879, 2)).toBe('9.87');
  });

  it('ignores sub-millisecond fractions', () => {
    expect(formatDuration(1234.9)).toBe('1.234');
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects %p', (ms) => {
    expect(() => formatDuration(ms)).toThrow(RangeError);
  });
});
