/** Longest time accepted for a manually entered solve. */
export const MAX_MANUAL_TIME_MS = 24 * 60 * 60 * 1000;

export type ParseTimeResult = { ok: true; ms: number } | { ok: false; error: string };

/**
 * Parses a typed solve time into milliseconds.
 *
 * - With punctuation: "12.34", "12.345", "1:02.34", "1:02:03.5".
 * - Digits only, the quick way timers like csTimer accept: the last two digits are
 *   hundredths, so "1234" is 12.34 and "10234" is 1:02.34.
 */
export function parseTimeInput(input: string): ParseTimeResult {
  const text = input.trim();
  if (!text) return { ok: false, error: 'Enter a time' };

  let ms: number;
  if (/^\d+$/.test(text)) {
    ms = parseDigitsOnly(text);
  } else {
    const match = /^(?:(\d+):)??(?:(\d+):)?(\d+)(?:\.(\d{1,3}))?$/.exec(text);
    if (!match) return { ok: false, error: 'Use a format like 12.34 or 1:02.34' };
    const [, h, m, s, fraction = ''] = match;
    const hours = Number(h ?? 0);
    const minutes = Number(m ?? 0);
    const seconds = Number(s);
    if ((h !== undefined || m !== undefined) && seconds >= 60) {
      return { ok: false, error: 'Seconds must be under 60' };
    }
    if (h !== undefined && minutes >= 60) return { ok: false, error: 'Minutes must be under 60' };
    ms = ((hours * 60 + minutes) * 60 + seconds) * 1000 + Number(fraction.padEnd(3, '0'));
  }

  if (ms <= 0) return { ok: false, error: 'The time must be more than zero' };
  if (ms > MAX_MANUAL_TIME_MS) return { ok: false, error: 'The time must be under 24 hours' };
  return { ok: true, ms };
}

/** "1234" → 12.34 s, "10234" → 1:02.34, "1020304" → 1:02:03.04. */
function parseDigitsOnly(digits: string): number {
  const padded = digits.padStart(8, '0');
  const hours = Number(padded.slice(0, -6));
  const minutes = Number(padded.slice(-6, -4));
  const seconds = Number(padded.slice(-4, -2));
  const hundredths = Number(padded.slice(-2));
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + hundredths * 10;
}
