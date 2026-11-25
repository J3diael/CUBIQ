import type { PuzzleId } from '@/constants/puzzles';
import { getDatabase } from '@/database/client';
import { formatStat, newRecords, RECORD_LABELS, type RecordKind } from '@/lib/stats';
import { feedback } from '@/services/feedback';
import { useDataStore } from '@/store/data-store';
import { useSettingsStore } from '@/store/settings-store';
import { useUiStore } from '@/store/ui-store';
import type { Solve } from '@/types/models';

import { goalActions } from '@/features/goals/actions';

import { getPersonalRecords } from './queries';

type NewSolve = Parameters<ReturnType<typeof useDataStore.getState>['addSolve']>[0] & {
  puzzleId: PuzzleId;
};

/**
 * Saves a solve and checks whether it set a personal best (single, Ao5, Ao12 or Ao100).
 * Records are compared before and after the save, so penalties and deletions are
 * always reflected and nothing about records is stored.
 */
export function saveSolveAndCheckRecords(
  input: NewSolve,
  options: { announce?: 'toast' | 'none' } = {},
): { solve: Solve; records: RecordKind[]; message: string | null } {
  const db = getDatabase();
  const before = getPersonalRecords(db, input.puzzleId);
  const solve = useDataStore.getState().addSolve(input);
  const after = getPersonalRecords(db, input.puzzleId);
  const records = newRecords(before, after);

  let message: string | null = null;
  if (records.length) {
    const decimals = useSettingsStore.getState().timer.decimals;
    message = `New personal best: ${records
      .map((kind) => `${RECORD_LABELS[kind]} ${formatStat(after[kind], decimals)}`)
      .join(', ')}`;
    feedback('record');
  }
  // Goals this solve completed (solve counts, times, streaks) are announced with it.
  const goalMessage = goalActions.sync('none');
  message = [message, goalMessage].filter(Boolean).join('. ') || null;
  if (message && options.announce !== 'none') useUiStore.getState().showToast({ message });
  return { solve, records, message };
}
