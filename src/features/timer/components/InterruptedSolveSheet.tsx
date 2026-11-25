import { Button, Sheet, Text } from '@/components/ui';
import { formatSolveDate } from '@/lib/time/date';
import { useDataStore } from '@/store/data-store';

/**
 * Shown at launch when the app closed while a solve was running (a crash, or the
 * system ending the app). The time can't be known, so it can be kept as a DNF.
 */
export function InterruptedSolveSheet() {
  const pending = useDataStore((s) => s.interruptedSolve);
  const resolve = useDataStore((s) => s.resolveInterruptedSolve);

  return (
    <Sheet
      visible={pending !== null}
      onClose={() => resolve('discard')}
      title="A solve was interrupted"
    >
      <Text variant="body" color="textSecondary">
        {pending
          ? `CUBIQ closed while a solve was running (${formatSolveDate(pending.startedAt)}). Its time was lost. You can keep it as a DNF with its scramble, or discard it.`
          : ''}
      </Text>
      <Button label="Save as DNF" fullWidth onPress={() => resolve('save-dnf')} />
      <Button label="Discard" variant="ghost" fullWidth onPress={() => resolve('discard')} />
    </Sheet>
  );
}
