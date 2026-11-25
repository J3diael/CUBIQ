import {
  masteryLevel,
  masteryScore,
  NEW_CARD,
  nextIntervalLabel,
  review,
  type Grade,
} from '../srs';

const DAY = 24 * 60 * 60 * 1000;

function run(grades: Grade[]) {
  let state = { ...NEW_CARD };
  let dueAt = 0;
  for (const g of grades) ({ dueAt, ...state } = review(state, g, 0));
  return { state, dueAt };
}

describe('spaced repetition', () => {
  it('grows the gap with each good answer', () => {
    expect(run(['good']).state.intervalDays).toBe(1);
    expect(run(['good', 'good']).state.intervalDays).toBe(3);
    expect(run(['good', 'good', 'good']).state.intervalDays).toBe(7.5);
    expect(run(['good']).dueAt).toBe(DAY);
  });

  it('brings a missed card back in ten minutes and lowers its ease', () => {
    const { state, dueAt } = run(['good', 'good', 'again']);
    expect(state).toMatchObject({ intervalDays: 0, lapses: 1, reviews: 3, correct: 2, ease: 2.3 });
    expect(dueAt).toBe(10 * 60 * 1000);
  });

  it('never drops ease below 1.3', () => {
    expect(run(Array<Grade>(10).fill('again')).state.ease).toBe(1.3);
  });

  it('labels the next gap for each button', () => {
    expect(nextIntervalLabel(NEW_CARD, 'again')).toBe('10m');
    expect(nextIntervalLabel(NEW_CARD, 'good')).toBe('1d');
    expect(nextIntervalLabel(NEW_CARD, 'easy')).toBe('3d');
  });
});

describe('mastery', () => {
  it('starts at zero and reaches mastered after three weeks of correct answers', () => {
    expect(masteryLevel(NEW_CARD)).toBe('new');
    expect(masteryLevel(run(['good']).state)).toBe('learning');
    expect(masteryLevel(run(['good', 'good']).state)).toBe('familiar');
    const strong = run(['good', 'good', 'good', 'good', 'good']).state;
    expect(masteryScore(strong)).toBe(100);
    expect(masteryLevel(strong)).toBe('mastered');
  });

  it('is held back by misses', () => {
    const shaky = run(['again', 'again', 'good', 'good', 'good', 'good', 'good']).state;
    expect(masteryScore(shaky)).toBe(71);
    expect(masteryLevel(shaky)).toBe('familiar');
  });
});
