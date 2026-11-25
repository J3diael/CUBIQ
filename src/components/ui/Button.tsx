import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

import { touchTarget, useTheme } from '@/theme';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  icon?: ComponentType<LucideProps>;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  icon: Icon,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const { colors } = theme;

  const background =
    variant === 'primary'
      ? colors.accent
      : variant === 'secondary'
        ? colors.surfaceRaised
        : 'transparent';
  const foreground =
    variant === 'primary' ? 'textOnAccent' : variant === 'ghost' ? 'accent' : 'textPrimary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.lg,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
      {...rest}
    >
      <View style={[styles.content, { gap: theme.spacing.xs }]}>
        {Icon ? <Icon size={18} color={colors[foreground]} strokeWidth={2} /> : null}
        <Text variant="bodyStrong" color={foreground}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: touchTarget + 4, justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
