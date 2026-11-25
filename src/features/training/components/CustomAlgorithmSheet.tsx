import { useState } from 'react';
import { View } from 'react-native';

import { Button, Sheet, Text, TextField } from '@/components/ui';
import {
  customAlgorithmSchema,
  type CustomAlgorithm,
  type CustomAlgorithmInput,
} from '@/database/repositories/training-repository';
import type { CustomAlgorithmSet } from '@/database/schema';
import { useTheme } from '@/theme';

import { OptionChips } from '@/features/sessions/components/OptionChips';

const SET_LABELS: Record<CustomAlgorithmSet, string> = {
  f2l: 'F2L',
  oll: 'OLL',
  pll: 'PLL',
  other: 'Other',
};

interface CustomAlgorithmSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: CustomAlgorithmInput) => void;
  /** Editing an existing algorithm. */
  existing?: CustomAlgorithm | null;
  /** Adding an alternative for a built-in case: set and case are fixed. */
  forCase?: { id: string; name: string; set: CustomAlgorithmSet } | null;
  /** Shows a delete button when editing. */
  onDelete?: () => void;
}

export function CustomAlgorithmSheet({
  visible,
  onClose,
  onSave,
  existing,
  forCase,
  onDelete,
}: CustomAlgorithmSheetProps) {
  const theme = useTheme();
  const [name, setName] = useState(existing?.name ?? (forCase ? `My ${forCase.name}` : ''));
  const [algorithm, setAlgorithm] = useState(existing?.algorithm ?? '');
  const [set, setSet] = useState<CustomAlgorithmSet>(existing?.set ?? forCase?.set ?? 'other');
  const [collection, setCollection] = useState(existing?.collection ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = () => {
    const input = {
      name,
      algorithm,
      set,
      caseId: existing?.caseId ?? forCase?.id ?? null,
      collection: forCase || existing?.caseId ? null : collection,
      notes,
    };
    const parsed = customAlgorithmSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    onSave(input);
    onClose();
  };

  const isAlternative = !!(forCase || existing?.caseId);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={
        existing ? 'Edit algorithm' : forCase ? `Alternative for ${forCase.name}` : 'New algorithm'
      }
    >
      <View style={{ gap: theme.spacing.md }}>
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          error={errors.name}
          maxLength={60}
        />
        <TextField
          label="Moves"
          mono
          value={algorithm}
          onChangeText={setAlgorithm}
          placeholder="R U R' U'"
          autoCorrect={false}
          autoCapitalize="none"
          error={errors.algorithm}
          hint="Standard notation: R U R' U2, wide moves (r or Rw), M E S, x y z."
        />
        {!isAlternative ? (
          <>
            <OptionChips
              label="Type"
              options={SET_LABELS}
              value={set}
              onChange={(v) => setSet(v ?? 'other')}
            />
            <TextField
              label="Collection (optional)"
              value={collection}
              onChangeText={setCollection}
              placeholder="e.g. COLL, Roux CMLL"
              maxLength={40}
            />
          </>
        ) : (
          <Text variant="caption" color="textSecondary">
            It will appear next to the built-in algorithms for this case.
          </Text>
        )}
        <TextField
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={500}
        />
        <Button label="Save algorithm" fullWidth onPress={save} />
        {existing && onDelete ? (
          <Button
            label="Delete algorithm"
            variant="ghost"
            fullWidth
            onPress={() => {
              onClose();
              onDelete();
            }}
          />
        ) : null}
      </View>
    </Sheet>
  );
}
