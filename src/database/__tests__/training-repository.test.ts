/**
 * @jest-environment node
 */
import type { AppDatabase } from '../client';
import {
  createCustomAlgorithm,
  deleteCustomAlgorithm,
  getCustomAlgorithm,
  getProgress,
  listCustomAlgorithms,
  listCustomAlgorithmsForCase,
  listProgress,
  recordExecution,
  recordReview,
  resetProgress,
  setFavorite,
  setPreferredAlgorithm,
  setProgressNotes,
  setStatus,
  updateCustomAlgorithm,
} from '../repositories/training-repository';
import { createTestDatabase } from '../test-utils';

let db: AppDatabase;
let close: () => void;
beforeEach(() => ({ db, close } = createTestDatabase()));
afterEach(() => close());

describe('algorithm progress', () => {
  it('starts empty and is created on the first change', () => {
    expect(getProgress(db, 'pll.t')).toMatchObject({
      status: 'new',
      reviews: 0,
      isFavorite: false,
    });
    expect(listProgress(db).size).toBe(0);
    setStatus(db, 'pll.t', 'learned', 100);
    setFavorite(db, 'pll.t', true, 200);
    setPreferredAlgorithm(db, 'pll.t', "R U R'", 300);
    setProgressNotes(db, 'pll.t', '  lefty finish  ', 400);
    expect(getProgress(db, 'pll.t')).toMatchObject({
      status: 'learned',
      isFavorite: true,
      preferredAlgorithm: "R U R'",
      notes: 'lefty finish',
      updatedAt: 400,
    });
    expect([...listProgress(db).keys()]).toEqual(['pll.t']);
  });

  it('schedules reviews and moves new cases to learning', () => {
    recordReview(db, 'oll.21', 'good', 1_000);
    expect(getProgress(db, 'oll.21')).toMatchObject({
      status: 'learning',
      reviews: 1,
      correct: 1,
      intervalDays: 1,
      dueAt: 1_000 + 24 * 60 * 60 * 1000,
      lastReviewedAt: 1_000,
    });
    recordReview(db, 'oll.21', 'again', 2_000);
    expect(getProgress(db, 'oll.21')).toMatchObject({
      reviews: 2,
      correct: 1,
      lapses: 1,
      intervalDays: 0,
    });
  });

  it('keeps a learned status through reviews', () => {
    setStatus(db, 'pll.h', 'learned');
    recordReview(db, 'pll.h', 'easy');
    expect(getProgress(db, 'pll.h').status).toBe('learned');
  });

  it('tracks best and last execution times', () => {
    recordExecution(db, 'pll.ua', 2_400);
    recordExecution(db, 'pll.ua', 1_900);
    recordExecution(db, 'pll.ua', 2_100);
    expect(getProgress(db, 'pll.ua')).toMatchObject({
      executions: 3,
      bestExecutionMs: 1_900,
      lastExecutionMs: 2_100,
    });
    expect(() => recordExecution(db, 'pll.ua', 0)).toThrow();
  });

  it('can be reset', () => {
    recordReview(db, 'pll.ua', 'good');
    resetProgress(db, 'pll.ua');
    expect(getProgress(db, 'pll.ua').reviews).toBe(0);
  });
});

describe('custom algorithms', () => {
  it('creates, edits and soft-deletes algorithms', () => {
    const alt = createCustomAlgorithm(db, {
      name: 'My T',
      algorithm: 'R U R’ U’  R’ F R2 U’ R’ U’ R U R’ F’',
      set: 'pll',
      caseId: 'pll.t',
    });
    expect(alt.algorithm).toBe("R U R' U' R' F R2 U' R' U' R U R' F'");
    const own = createCustomAlgorithm(db, {
      name: 'Sune variant',
      algorithm: "R U R' U R U2 R'",
      set: 'other',
      collection: 'COLL',
      notes: '',
    });
    expect(own).toMatchObject({ collection: 'COLL', notes: null, caseId: null });
    expect(listCustomAlgorithmsForCase(db, 'pll.t').map((a) => a.id)).toEqual([alt.id]);

    updateCustomAlgorithm(db, own.id, { ...own, name: 'Sune', notes: 'two-gen' });
    expect(getCustomAlgorithm(db, own.id)).toMatchObject({ name: 'Sune', notes: 'two-gen' });

    deleteCustomAlgorithm(db, alt.id);
    expect(listCustomAlgorithms(db).map((a) => a.name)).toEqual(['Sune']);
    expect(getCustomAlgorithm(db, alt.id)).toBeNull();
  });

  it('rejects invalid notation and blank names', () => {
    expect(() => createCustomAlgorithm(db, { name: 'x', algorithm: 'R Q', set: 'oll' })).toThrow(
      'standard notation',
    );
    expect(() => createCustomAlgorithm(db, { name: ' ', algorithm: 'R', set: 'oll' })).toThrow(
      'Give it a name',
    );
  });
});
