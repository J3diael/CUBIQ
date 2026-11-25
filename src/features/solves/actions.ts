import { useDataStore } from '@/store/data-store';
import { useUiStore } from '@/store/ui-store';

/** Deletes a solve and offers Undo for a few seconds. */
export function deleteSolveWithUndo(id: string): void {
  const { deleteSolve, restoreSolve } = useDataStore.getState();
  deleteSolve(id);
  useUiStore.getState().showToast({
    message: 'Solve deleted',
    actionLabel: 'Undo',
    onAction: () => restoreSolve(id),
  });
}
