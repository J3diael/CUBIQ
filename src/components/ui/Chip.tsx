import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface ChipProps {
  label: string;
  /** Highlighted chips use the accent colour, e.g. the selected option or the active session. */
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function Chip({ label, selected = false, onPress, accessibilityLabel }: ChipProps) {
  const theme = useTheme();
  const style = {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs + 2,
    borderRadius: theme.radius.full,
    backgroundColor: selected ? theme.colors.accentMuted : theme.colors.surfaceRaised,
    alignSelf: 'flex-start' as const,
  };
  const content = (
    <Text variant="label" color={selected ? 'accent' : 'textSecondary'}>
      {label}
    </Text>
  );

  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1 }]}
    >
      {content}
    </Pressable>
  );
}
