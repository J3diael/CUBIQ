import { View } from 'react-native';

import { Chip, Text } from '@/components/ui';
import { useTheme } from '@/theme';

interface OptionChipsProps<T extends string> {
  label: string;
  options: Record<T, string>;
  value: T | null;
  /** Tapping the selected chip clears it: these fields are optional. */
  onChange: (value: T | null) => void;
}

export function OptionChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: OptionChipsProps<T>) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {(Object.keys(options) as T[]).map((key) => (
          <Chip
            key={key}
            label={options[key]}
            selected={value === key}
            onPress={() => onChange(value === key ? null : key)}
          />
        ))}
      </View>
    </View>
  );
}
