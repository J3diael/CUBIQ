import type { ReviewState } from './srs';

export type FlashcardFilter = 'due' | 'learning' | 'favorites' | 'all';

export interface FlashcardCandidate {
  key: string;
  progress: ReviewState & { dueAt: number | null; status: string; isFavorite: boolean };
}

/**
 * Picks the cards for a flashcard round. "Due" means cards whose review time has
 * come plus cards never seen; due cards come first (most overdue first), then new ones
 * in random order, so a round always teaches the most useful cards.
 */
export function buildFlashcardQueue(
  candidates: readonly FlashcardCandidate[],
  filter: FlashcardFilter,
  now: number,
  limit = 20,
  random: () => number = Math.random,
): string[] {
  const filtered = candidates.filter(({ progress: p }) => {
    switch (filter) {
      case 'due':
        return p.reviews === 0 || (p.dueAt !== null && p.dueAt <= now);
      case 'learning':
        return p.status === 'learning';
      case 'favorites':
        return p.isFavorite;
      case 'all':
        return true;
    }
  });
  const due = filtered
    .filter((c) => c.progress.reviews > 0 && c.progress.dueAt !== null && c.progress.dueAt <= now)
    .sort((a, b) => a.progress.dueAt! - b.progress.dueAt!);
  const rest = shuffle(
    filtered.filter((c) => !due.includes(c)),
    random,
  );
  return [...due, ...rest].slice(0, limit).map((c) => c.key);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
