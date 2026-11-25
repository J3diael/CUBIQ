import type { AppDatabase } from '@/database/client';
import type { LearningStatus } from '@/database/schema';
import {
  createCustomAlgorithm,
  deleteCustomAlgorithm,
  recordExecution,
  recordReview,
  restoreCustomAlgorithm,
  setFavorite,
  setPreferredAlgorithm,
  setProgressNotes,
  setStatus,
  updateCustomAlgorithm,
  type CustomAlgorithmInput,
} from '@/database/repositories/training-repository';
import type { Grade } from '@/lib/training/srs';
import { goalActions } from '@/features/goals/actions';
import { useDataStore } from '@/store/data-store';
import { useUiStore } from '@/store/ui-store';

function write<T>(action: (db: AppDatabase) => T): T {
  return useDataStore.getState().write(action);
}

/** Training writes. Each one saves to SQLite and refreshes open screens. */
export const training = {
  setStatus: (key: string, status: LearningStatus) => {
    write((db) => setStatus(db, key, status));
    // "Learn all PLL" and similar goals complete when the last case is learned.
    if (status === 'learned') goalActions.sync();
  },
  setFavorite: (key: string, value: boolean) => write((db) => setFavorite(db, key, value)),
  setPreferred: (key: string, algorithm: string | null) =>
    write((db) => setPreferredAlgorithm(db, key, algorithm)),
  setNotes: (key: string, notes: string) => write((db) => setProgressNotes(db, key, notes)),
  review: (key: string, grade: Grade) => write((db) => recordReview(db, key, grade)),
  execution: (key: string, ms: number) => write((db) => recordExecution(db, key, ms)),
  createCustom: (input: CustomAlgorithmInput) => write((db) => createCustomAlgorithm(db, input)),
  updateCustom: (id: string, input: CustomAlgorithmInput) =>
    write((db) => updateCustomAlgorithm(db, id, input)),
  /** Deletes a custom algorithm with Undo for a few seconds. */
  deleteCustom: (id: string) => {
    write((db) => deleteCustomAlgorithm(db, id));
    useUiStore.getState().showToast({
      message: 'Algorithm deleted',
      actionLabel: 'Undo',
      onAction: () => write((db) => restoreCustomAlgorithm(db, id)),
    });
  },
};
