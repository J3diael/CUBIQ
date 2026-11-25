import { View } from 'react-native';
import { Trash2 } from 'lucide-react-native';

import { Chip, IconButton, Text } from '@/components/ui';
import type { Penalty } from '@/lib/timer';
import type { Solve } from '@/types/models';
import { useTheme } from '@/theme';

interface LastSolveActionsProps {
  solve: Solve;
  onPenalty: (penalty: Penalty) => void;
  onDelete: () => void;
}

const OPTIONS: { value: Penalty; label: string }[] = [
  { value: 'none', label: 'OK' },
  { value: 'plus2', label: '+2' },
  { value: 'dnf', label: 'DNF' },
];

/** Penalty and delete controls for the solve that just finished. */
export function LastSolveActions({ solve, onPenalty, onDelete }: LastSolveActionsProps) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        {OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={solve.penalty === option.value}
            onPress={() => onPenalty(option.value)}
          />
        ))}
        <IconButton
          icon={Trash2}
          accessibilityLabel="Delete solve"
          color="danger"
          size={20}
          onPress={onDelete}
        />
      </View>
      {solve.wasInterrupted ? (
        <Text variant="caption" color="warning" align="center">
          The app was in the background during this solve.
        </Text>
      ) : null}
    </View>
  );
}
