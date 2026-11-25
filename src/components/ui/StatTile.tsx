import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface StatTileProps {
  label: string;
  /** Already formatted value. Use `—` when there is no data yet. */
  value: string;
  hint?: string;
}

export function StatTile({ label, value, hint }: StatTileProps) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value === '—' ? 'no data yet' : value}`}
      style={{
        flex: 1,
        minWidth: 0,
        gap: theme.spacing.xxs,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Text variant="overline" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="stat" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" color="textSecondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
