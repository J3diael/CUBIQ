import { buildFlashcardQueue, type FlashcardCandidate } from '../queue';
import { NEW_CARD } from '../srs';

const card = (
  key: string,
  extra: Partial<FlashcardCandidate['progress']> = {},
): FlashcardCandidate => ({
  key,
  progress: { ...NEW_CARD, dueAt: null, status: 'new', isFavorite: false, ...extra },
});

const seen = { reviews: 2, correct: 2, intervalDays: 3, status: 'learning' };

describe('buildFlashcardQueue', () => {
  const cards = [
    card('new-1'),
    card('later', { ...seen, dueAt: 5_000 }),
    card('overdue', { ...seen, dueAt: 100 }),
    card('due-now', { ...seen, dueAt: 900 }),
    card('fav', { ...seen, dueAt: 9_000, isFavorite: true, status: 'learned' }),
  ];

  it('puts overdue cards first, then new ones, and skips cards not yet due', () => {
    expect(buildFlashcardQueue(cards, 'due', 1_000, 20, () => 0)).toEqual([
      'overdue',
      'due-now',
      'new-1',
    ]);
  });

  it('filters by learning status and favourites', () => {
    expect(buildFlashcardQueue(cards, 'learning', 1_000, 20, () => 0).sort()).toEqual([
      'due-now',
      'later',
      'overdue',
    ]);
    expect(buildFlashcardQueue(cards, 'favorites', 1_000)).toEqual(['fav']);
  });

  it('respects the round size', () => {
    expect(buildFlashcardQueue(cards, 'all', 1_000, 2)).toHaveLength(2);
  });
});
