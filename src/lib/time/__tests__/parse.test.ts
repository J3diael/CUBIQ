import { parseTimeInput } from '../parse';

const ms = (input: string) => {
  const result = parseTimeInput(input);
  if (!result.ok) throw new Error(result.error);
  return result.ms;
};

describe('parseTimeInput', () => {
  it.each([
    ['12.34', 12_340],
    ['12.345', 12_345],
    ['12.3', 12_300],
    ['  9.87 ', 9_870],
    ['1:02.34', 62_340],
    ['1:02', 62_000],
    ['1:02:03.5', 3_723_500],
  ])('reads "%s" as %i ms', (input, expected) => {
    expect(ms(input)).toBe(expected);
  });

  it.each([
    ['1234', 12_340],
    ['987', 9_870],
    ['10234', 62_340],
    ['5', 50],
  ])('reads digits-only "%s" with the last two digits as hundredths', (input, expected) => {
    expect(ms(input)).toBe(expected);
  });

  it.each([
    ['', 'Enter a time'],
    ['abc', 'Use a format like 12.34 or 1:02.34'],
    ['12.3456', 'Use a format like 12.34 or 1:02.34'],
    ['1:75.00', 'Seconds must be under 60'],
    ['0', 'The time must be more than zero'],
    ['0.00', 'The time must be more than zero'],
    ['25:00:00', 'The time must be under 24 hours'],
  ])('rejects "%s"', (input, error) => {
    expect(parseTimeInput(input)).toEqual({ ok: false, error });
  });
});
