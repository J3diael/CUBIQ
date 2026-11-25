import { act, fireEvent, screen } from 'expo-router/testing-library';

import { getDatabase } from '@/database/client';
import { createGoal, listGoals } from '@/database/repositories/goals-repository';
import { ALGORITHM_SETS } from '@/content/algorithms';
import { saveSolveAndCheckRecords } from '@/features/stats/record-solve';
import { training } from '@/features/training/actions';
import { useDataStore } from '@/store/data-store';
import { useUiStore } from '@/store/ui-store';
import { renderApp } from '@/test-utils/render-app';

import { goalProgress, syncGoalCompletions } from '../queries';

const db = () => getDatabase();
const solve = (rawTimeMs: number, solvedAt = Date.now()) =>
  saveSolveAndCheckRecords(
    { puzzleId: '333', scramble: "R U R' U'", rawTimeMs, solvedAt },
    { announce: 'none' },
  );

describe('goal progress', () => {
  it('counts only solves after the goal was set', () => {
    useDataStore
      .getState()
      .addSolve({ puzzleId: '333', scramble: '', rawTimeMs: 10_000, solvedAt: 1 });
    const goal = createGoal(db(), { type: 'solves', target: 3 });
    solve(12_000);
    expect(goalProgress(db(), goal, Date.now()).text).toBe('1 of 3 solves');
  });

  it('completes a sub-X goal when a solve beats it, and says so', () => {
    createGoal(db(), { type: 'time', target: 20_000, puzzleId: '333', stat: 'single' });
    // The very first solve is not announced as a personal best.
    expect(solve(21_000).message).toBeNull();
    const { message } = solve(19_500);
    expect(message).toBe('New personal best: single 19.500. Goal reached: Sub-20 3x3 single');
    expect(listGoals(db())[0]?.completedAt).not.toBeNull();
  });

  it('completes "learn all PLL" when the last case is learned', () => {
    createGoal(db(), { type: 'algorithms', algorithmSet: 'pll' });
    const cases = ALGORITHM_SETS.pll.cases;
    cases.slice(0, -1).forEach((c) => training.setStatus(c.id, 'learned'));
    expect(listGoals(db())[0]?.completedAt).toBeNull();
    training.setStatus(cases.at(-1)!.id, 'learned');
    expect(listGoals(db())[0]?.completedAt).not.toBeNull();
    expect(useUiStore.getState().toast?.message).toBe('Goal reached: Learn all PLL');
  });

  it('never completes daily or custom goals by itself', () => {
    createGoal(db(), { type: 'daily', target: 1 });
    createGoal(db(), { type: 'custom', title: 'Improve F2L' });
    solve(15_000);
    expect(syncGoalCompletions(db(), Date.now())).toEqual([]);
    expect(listGoals(db()).every((g) => g.completedAt === null)).toBe(true);
  });
});

describe('goal screens', () => {
  it('creates a goal from Profile and shows its progress', async () => {
    solve(25_000);
    await renderApp('/profile');
    expect(screen.getByText('No goals yet')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'New goal' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save goal' }));
    expect(screen.getByText('Enter a time like 20 or 1:30')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Target time'), '20');
    await fireEvent.press(screen.getByRole('button', { name: 'Save goal' }));
    expect(screen.getByText('Sub-20 3x3 single')).toBeOnTheScreen();
    expect(screen.getByText('Best 25.000 · target under 20')).toBeOnTheScreen();
    expect(screen.getByLabelText('Solves: 1')).toBeOnTheScreen();
  });

  it('marks a custom goal done and lists it under achievements', async () => {
    createGoal(db(), { type: 'custom', title: 'Improve F2L' });
    await renderApp('/profile');
    await fireEvent.press(screen.getByRole('button', { name: /^Improve F2L/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Mark as done' }));
    expect(screen.getByText('Achievements')).toBeOnTheScreen();
    expect(screen.getByText(/^Reached Today/)).toBeOnTheScreen();
  });

  it('deletes a goal with undo', async () => {
    createGoal(db(), { type: 'streak', target: 7 });
    await renderApp('/profile');
    await fireEvent.press(screen.getByRole('button', { name: /^Practise 7 days in a row/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Delete goal' }));
    expect(screen.getByText('No goals yet')).toBeOnTheScreen();
    await act(async () => useUiStore.getState().toast?.onAction?.());
    expect(screen.getByText('Practise 7 days in a row')).toBeOnTheScreen();
  });

  it('shows the daily goal on Home', async () => {
    await renderApp('/');
    expect(screen.getByRole('button', { name: /^Daily goal/ })).toBeOnTheScreen();
    createGoal(db(), { type: 'daily', target: 4 });
    solve(15_000);
    await renderApp('/');
    expect(screen.getByText('1 of 4 solves today')).toBeOnTheScreen();
  });
});
