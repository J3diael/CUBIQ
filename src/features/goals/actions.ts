import {
  createGoal,
  deleteGoal,
  restoreGoal,
  setGoalCompleted,
  updateGoal,
  type Goal,
  type GoalInput,
} from '@/database/repositories/goals-repository';
import { feedback } from '@/services/feedback';
import { useDataStore } from '@/store/data-store';
import { useUiStore } from '@/store/ui-store';

import { syncGoalCompletions } from './queries';

/** "Goal reached: Sub-20 3x3 single" for one or more goals. */
export function goalsReachedMessage(reached: readonly Goal[]): string | null {
  if (reached.length === 0) return null;
  return `Goal reached: ${reached.map((g) => g.title).join(', ')}`;
}

/** Goal writes. Each saves to SQLite and refreshes open screens. */
export const goalActions = {
  create: (input: GoalInput) => {
    const goal = useDataStore.getState().write((db) => createGoal(db, input));
    // A goal that is already met (e.g. sub-30 when the best is 25) completes straight away.
    goalActions.sync();
    return goal;
  },
  update: (id: string, input: GoalInput) => {
    useDataStore.getState().write((db) => updateGoal(db, id, input));
    goalActions.sync();
  },
  setCompleted: (id: string, done: boolean) =>
    useDataStore.getState().write((db) => setGoalCompleted(db, id, done ? Date.now() : null)),
  delete: (id: string) => {
    useDataStore.getState().write((db) => deleteGoal(db, id));
    useUiStore.getState().showToast({
      message: 'Goal deleted',
      actionLabel: 'Undo',
      onAction: () => useDataStore.getState().write((db) => restoreGoal(db, id)),
    });
  },
  /**
   * Completes goals that have just been reached. With `announce: 'toast'` it also tells
   * the user; otherwise the caller shows the returned message.
   */
  sync: (announce: 'toast' | 'none' = 'toast'): string | null => {
    const reached = useDataStore.getState().write((db) => syncGoalCompletions(db, Date.now()));
    const message = goalsReachedMessage(reached);
    if (message) {
      feedback('record');
      if (announce === 'toast') useUiStore.getState().showToast({ message });
    }
    return message;
  },
};
