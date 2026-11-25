import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, type LucideProps } from 'lucide-react-native';

import { touchTarget, useTheme } from '@/theme';

import { Text } from './Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<LucideProps>;
  /** Element on the right, such as a Chip or a value. */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Shows a chevron. Defaults to true when the row is pressable. */
  showChevron?: boolean;
}

export function ListRow({
  title,
  subtitle,
  icon: Icon,
  trailing,
  onPress,
  showChevron,
}: ListRowProps) {
  const theme = useTheme();
  const chevron = showChevron ?? !!onPress;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          gap: theme.spacing.sm,
          backgroundColor: pressed ? theme.colors.surfaceRaised : 'transparent',
        },
      ]}
    >
      {Icon ? <Icon size={20} color={theme.colors.textSecondary} strokeWidth={2} /> : null}
      <View style={styles.text}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {chevron ? <ChevronRight size={18} color={theme.colors.textSecondary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: touchTarget + 12 },
  text: { flex: 1, gap: 2 },
});
