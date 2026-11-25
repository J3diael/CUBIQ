import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { useNow } from '@/hooks/use-now';
import { useDbQuery } from '@/store/data-store';
import { useSettingsStore } from '@/store/settings-store';

import { goalActions } from './actions';
import { listGoalsWithProgress } from './queries';

/**
 * Goals with live progress. When the screen comes into focus, goals reached since
 * the last check (a streak that ticked over at midnight, say) are completed.
 */
export function useGoals() {
  const now = useNow();
  const decimals = useSettingsStore((s) => s.timer.decimals);
  const goals = useDbQuery((db) => listGoalsWithProgress(db, now, decimals));
  useFocusEffect(
    useCallback(() => {
      goalActions.sync();
    }, []),
  );
  return goals;
}
