/**
 * @jest-environment node
 */
import type { AppDatabase } from '../client';
import {
  createGoal,
  deleteGoal,
  getGoal,
  goalInputSchema,
  listGoals,
  restoreGoal,
  setGoalCompleted,
  updateGoal,
} from '../repositories/goals-repository';
import { createTestDatabase } from '../test-utils';

let db: AppDatabase;
let close: () => void;
beforeEach(() => ({ db, close } = createTestDatabase()));
afterEach(() => close());

describe('goals', () => {
  it('creates goals with generated titles and keeps only the fields each type uses', () => {
    const g = createGoal(db, {
      type: 'time',
      target: 20_000,
      puzzleId: '333',
      stat: 'ao5',
      algorithmSet: 'pll',
    });
    expect(g).toMatchObject({
      title: 'Sub-20 3x3 Ao5',
      stat: 'ao5',
      algorithmSet: null,
      completedAt: null,
    });
    const pll = createGoal(db, {
      type: 'algorithms',
      algorithmSet: 'pll',
      target: 5,
      puzzleId: '333',
    });
    expect(pll).toMatchObject({ title: 'Learn all PLL', target: null, puzzleId: null });
    const custom = createGoal(db, { type: 'custom', title: '  Improve F2L ', target: 3 });
    expect(custom).toMatchObject({ title: 'Improve F2L', target: null });
  });

  it('explains what each type is missing', () => {
    const issues = (input: Parameters<typeof goalInputSchema.safeParse>[0]) => {
      const r = goalInputSchema.safeParse(input);
      return r.success ? [] : r.error.issues.map((i) => i.path[0]);
    };
    expect(issues({ type: 'time' })).toEqual(['target', 'puzzleId', 'stat']);
    expect(issues({ type: 'solves', target: 0 })).toEqual(['target']);
    expect(issues({ type: 'streak', target: 1 })).toEqual(['target']);
    expect(issues({ type: 'algorithms' })).toEqual(['algorithmSet']);
    expect(issues({ type: 'custom', title: '  ' })).toEqual(['title']);
    expect(issues({ type: 'daily', target: 20 })).toEqual([]);
  });

  it('lists open goals first, then reached ones newest first', () => {
    const a = createGoal(db, { type: 'daily', target: 10 }, 1);
    const b = createGoal(db, { type: 'solves', target: 10 }, 2);
    const c = createGoal(db, { type: 'streak', target: 3 }, 3);
    setGoalCompleted(db, b.id, 50);
    setGoalCompleted(db, c.id, 60);
    expect(listGoals(db).map((g) => g.id)).toEqual([a.id, c.id, b.id]);
  });

  it('reopens a goal whose target changes, but not one whose name changes', () => {
    const g = createGoal(db, { type: 'solves', target: 10 });
    setGoalCompleted(db, g.id, 100);
    updateGoal(db, g.id, { type: 'solves', target: 10, title: 'Ten solves' });
    expect(getGoal(db, g.id)).toMatchObject({ title: 'Ten solves', completedAt: 100 });
    updateGoal(db, g.id, { type: 'solves', target: 50, title: null });
    expect(getGoal(db, g.id)).toMatchObject({ title: 'Complete 50 solves', completedAt: null });
  });

  it('soft-deletes with undo', () => {
    const g = createGoal(db, { type: 'daily', target: 5 });
    deleteGoal(db, g.id);
    expect(listGoals(db)).toHaveLength(0);
    restoreGoal(db, g.id);
    expect(listGoals(db)).toHaveLength(1);
  });
});
