/**
 * @jest-environment node
 */
import type { AppDatabase } from '../client';
import {
  getLessonProgress,
  listLessonProgress,
  recordPractice,
  resetLesson,
  setLessonStep,
} from '../repositories/learning-repository';
import { createTestDatabase } from '../test-utils';

let db: AppDatabase;
let close: () => void;
beforeEach(() => ({ db, close } = createTestDatabase()));
afterEach(() => close());

describe('lesson progress', () => {
  it('starts empty, remembers the step reached and keeps the first completion', () => {
    expect(getLessonProgress(db, 'beginner.cross')).toMatchObject({
      lastStep: 0,
      completedAt: null,
      attempts: 0,
    });
    setLessonStep(db, 'beginner.cross', 1, 100);
    expect(getLessonProgress(db, 'beginner.cross').lastStep).toBe(1);

    recordPractice(db, 'beginner.cross', { correct: 1, total: 2 }, 200);
    recordPractice(db, 'beginner.cross', { correct: 2, total: 2 }, 300);
    recordPractice(db, 'beginner.cross', { correct: 0, total: 2 }, 400);
    expect(getLessonProgress(db, 'beginner.cross')).toMatchObject({
      lastStep: 1,
      completedAt: 200,
      bestScore: 2,
      practiceTotal: 2,
      attempts: 3,
      updatedAt: 400,
    });
    expect([...listLessonProgress(db).keys()]).toEqual(['beginner.cross']);
  });

  it('rejects impossible results and steps', () => {
    expect(() => recordPractice(db, 'x', { correct: 3, total: 2 })).toThrow();
    expect(() => recordPractice(db, 'x', { correct: 0, total: 0 })).toThrow();
    expect(() => setLessonStep(db, 'x', -1)).toThrow();
    expect(listLessonProgress(db).size).toBe(0);
  });

  it('starts a lesson over', () => {
    recordPractice(db, 'beginner.meet', { correct: 4, total: 4 });
    resetLesson(db, 'beginner.meet');
    expect(getLessonProgress(db, 'beginner.meet').completedAt).toBeNull();
  });
});
