/**
 * Spaced repetition for flashcards, a simplified SM-2 (the scheduler behind Anki).
 * Cards you know well come back after longer and longer gaps; a miss brings a card
 * back the same day. Pure functions, so they're easy to test.
 */
export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewState {
  ease: number;
  intervalDays: number;
  reviews: number;
  correct: number;
  lapses: number;
}

export const NEW_CARD: ReviewState = {
  ease: 2.5,
  intervalDays: 0,
  reviews: 0,
  correct: 0,
  lapses: 0,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;
/** A missed card comes back after ten minutes. */
const RELEARN_MS = 10 * 60 * 1000;

export function review(
  state: ReviewState,
  grade: Grade,
  now: number,
): ReviewState & { dueAt: number } {
  const reviews = state.reviews + 1;
  if (grade === 'again') {
    return {
      ease: Math.max(MIN_EASE, state.ease - 0.2),
      intervalDays: 0,
      reviews,
      correct: state.correct,
      lapses: state.lapses + 1,
      dueAt: now + RELEARN_MS,
    };
  }
  let interval: number;
  let ease = state.ease;
  if (grade === 'hard') {
    interval = Math.max(1, state.intervalDays * 1.2);
    ease = Math.max(MIN_EASE, ease - 0.15);
  } else if (grade === 'good') {
    interval = state.intervalDays < 1 ? 1 : state.intervalDays < 3 ? 3 : state.intervalDays * ease;
  } else {
    interval = state.intervalDays < 1 ? 3 : state.intervalDays * ease * 1.3;
    ease += 0.15;
  }
  interval = Math.round(interval * 10) / 10;
  return {
    ease: Math.round(ease * 100) / 100,
    intervalDays: interval,
    reviews,
    correct: state.correct + 1,
    lapses: state.lapses,
    dueAt: now + interval * DAY_MS,
  };
}

/** When the next review of each grade would be, for labels like "Good · 3d". */
export function nextIntervalLabel(state: ReviewState, grade: Grade, now = 0): string {
  const { dueAt } = review(state, grade, now);
  const ms = dueAt - now;
  if (ms < 60 * 60 * 1000) return `${Math.round(ms / 60000)}m`;
  const days = ms / DAY_MS;
  if (days < 30) return `${Math.round(days)}d`;
  return `${Math.round(days / 30)}mo`;
}

export type MasteryLevel = 'new' | 'learning' | 'familiar' | 'mastered';

/**
 * Mastery from 0 to 100, from how long you can go between reviews (up to three weeks)
 * and how often you got the card right. Computed, never stored.
 */
export function masteryScore(state: ReviewState): number {
  if (state.reviews === 0) return 0;
  const retention = Math.min(1, state.intervalDays / 21);
  const accuracy = state.correct / state.reviews;
  return Math.round(retention * accuracy * 100);
}

export function masteryLevel(state: ReviewState): MasteryLevel {
  if (state.reviews === 0) return 'new';
  const score = masteryScore(state);
  if (score >= 80) return 'mastered';
  if (state.intervalDays >= 3) return 'familiar';
  return 'learning';
}

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  new: 'Not practised',
  learning: 'Learning',
  familiar: 'Familiar',
  mastered: 'Mastered',
};
