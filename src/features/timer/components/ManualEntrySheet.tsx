import { useState } from 'react';
import { View } from 'react-native';

import { Button, SegmentedControl, Sheet, Text, TextField } from '@/components/ui';
import { parseTimeInput } from '@/lib/time/parse';
import { formatSolveTime } from '@/lib/time/format-result';
import type { Penalty } from '@/lib/timer/types';
import { useTheme } from '@/theme';

const PENALTY_OPTIONS = [
  { value: 'none', label: 'OK' },
  { value: 'plus2', label: '+2' },
  { value: 'dnf', label: 'DNF' },
] as const satisfies readonly { value: Penalty; label: string }[];

interface ManualEntrySheetProps {
  visible: boolean;
  /** The scramble that will be saved with the time, or null if none is ready. */
  scramble: string | null;
  onClose: () => void;
  onSave: (entry: { rawTimeMs: number; penalty: Penalty }) => void;
}

/** Type a time from another timer (a stackmat, a competition) into the current session. */
export function ManualEntrySheet({ visible, scramble, onClose, onSave }: ManualEntrySheetProps) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [penalty, setPenalty] = useState<Penalty>('none');
  const [submitted, setSubmitted] = useState(false);

  const parsed = parseTimeInput(text);
  const error = submitted && !parsed.ok ? parsed.error : null;

  const close = () => {
    setText('');
    setPenalty('none');
    setSubmitted(false);
    onClose();
  };

  const save = () => {
    setSubmitted(true);
    if (!parsed.ok) return;
    onSave({ rawTimeMs: parsed.ms, penalty });
    close();
  };

  return (
    <Sheet visible={visible} onClose={close} title="Add a time">
      <View style={{ gap: theme.spacing.md }}>
        <TextField
          label="Time"
          mono
          autoFocus
          value={text}
          onChangeText={setText}
          placeholder="12.34"
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={save}
          error={error}
          hint={
            parsed.ok
              ? `Saves as ${formatSolveTime(parsed.ms, penalty, 3, { showRawForDnf: true })}`
              : 'Type 12.34 or 1:02.34. Digits only also work: 1234 is 12.34.'
          }
        />
        <SegmentedControl
          accessibilityLabel="Penalty"
          options={PENALTY_OPTIONS}
          value={penalty}
          onChange={setPenalty}
        />
        <Text variant="caption" color="textSecondary">
          {scramble
            ? `Saved with the current scramble: ${scramble}`
            : 'No scramble is ready, so this time is saved without one.'}
        </Text>
        <Button label="Save time" fullWidth onPress={save} />
      </View>
    </Sheet>
  );
}
