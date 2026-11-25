/**
 * Formats a duration in milliseconds the way cubers read it:
 * 9.874, 59.999, 1:02.345, 1:00:00.000.
 * Times are truncated (not rounded) to the chosen precision, matching WCA practice.
 */
export function formatDuration(ms: number, decimals: 2 | 3 = 3): string {
  if (!Number.isFinite(ms) || ms < 0) {
    throw new RangeError(`Cannot format duration: ${ms}`);
  }
  const totalMs = Math.floor(ms);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);
  const fraction = String(totalMs % 1000)
    .padStart(3, '0')
    .slice(0, decimals);

  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}.${fraction}`;
  }
  if (minutes > 0) {
    return `${minutes}:${pad2(seconds)}.${fraction}`;
  }
  return `${seconds}.${fraction}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Time spent, roughly: "45s", "12m", "3h 05m". */
export function formatTotalTime(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return `${Math.floor(ms / 1000)}s`;
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}
