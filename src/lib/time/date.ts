/** Midnight at the start of the local day containing `now`. */
export function startOfLocalDay(now: number = Date.now()): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** "Today, 14:05", "Yesterday, 09:12" or "3 Nov 2026, 18:40" in the device's locale. */
export function formatSolveDate(at: number, now: number = Date.now()): string {
  const time = new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const today = startOfLocalDay(now);
  if (at >= today) return `Today, ${time}`;
  if (at >= today - 24 * 60 * 60 * 1000) return `Yesterday, ${time}`;
  const day = new Date(at).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${day}, ${time}`;
}
