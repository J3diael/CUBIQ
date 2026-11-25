import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * The current time for render, e.g. to count which flashcards are due. Refreshed
 * when the screen comes into focus and once a minute while it stays open, so
 * render itself stays pure.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      const tick = () => setNow(Date.now());
      const id = setInterval(tick, intervalMs);
      // Coming back to a tab: catch up straight away.
      const timeout = setTimeout(tick, 0);
      return () => {
        clearInterval(id);
        clearTimeout(timeout);
      };
    }, [intervalMs]),
  );
  return now;
}
