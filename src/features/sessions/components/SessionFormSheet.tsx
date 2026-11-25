import { useState } from 'react';
import { View } from 'react-native';

import { Button, Sheet, Text, TextField } from '@/components/ui';
import { sessionNameSchema } from '@/database/repositories/sessions-repository';
import type { SessionPurpose, SolvingMethod } from '@/types/models';
import { useTheme } from '@/theme';

import { METHOD_LABELS, PURPOSE_LABELS } from '../labels';
import { OptionChips } from './OptionChips';

export interface SessionFormValues {
  name: string;
  method: SolvingMethod | null;
  purpose: SessionPurpose | null;
}

interface SessionFormSheetProps {
  visible: boolean;
  mode: 'create' | 'rename';
  initialName?: string;
  onClose: () => void;
  onSubmit: (values: SessionFormValues) => void;
}

/** Creates a session (name, method, purpose) or renames one. */
export function SessionFormSheet({
  visible,
  mode,
  initialName = '',
  onClose,
  onSubmit,
}: SessionFormSheetProps) {
  const theme = useTheme();
  const [name, setName] = useState(initialName);
  const [method, setMethod] = useState<SolvingMethod | null>(null);
  const [purpose, setPurpose] = useState<SessionPurpose | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setName(initialName);
    setMethod(null);
    setPurpose(null);
    setError(null);
    onClose();
  };

  const submit = () => {
    const parsed = sessionNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the name');
      return;
    }
    onSubmit({ name: parsed.data, method, purpose });
    close();
  };

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={mode === 'create' ? 'New session' : 'Rename session'}
    >
      <View style={{ gap: theme.spacing.md }}>
        <TextField
          label="Name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (error) setError(null);
          }}
          placeholder="e.g. Morning practice"
          autoFocus
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={submit}
          error={error}
        />
        {mode === 'create' ? (
          <>
            <OptionChips
              label="Method (optional)"
              options={METHOD_LABELS}
              value={method}
              onChange={setMethod}
            />
            <OptionChips
              label="Purpose (optional)"
              options={PURPOSE_LABELS}
              value={purpose}
              onChange={setPurpose}
            />
            <Text variant="caption" color="textSecondary">
              Sessions are for 3x3 for now. Other puzzles arrive in Phase 7.
            </Text>
          </>
        ) : null}
        <Button
          label={mode === 'create' ? 'Create session' : 'Save name'}
          fullWidth
          onPress={submit}
        />
      </View>
    </Sheet>
  );
}
