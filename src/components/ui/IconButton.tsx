import type { ComponentType } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

import { touchTarget, useTheme, type ColorToken } from '@/theme';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: ComponentType<LucideProps>;
  /** Required: icon-only buttons need a label for screen readers. */
  accessibilityLabel: string;
  color?: ColorToken;
  size?: number;
}

export function IconButton({
  icon: Icon,
  color = 'textPrimary',
  size = 22,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => ({
        width: touchTarget,
        height: touchTarget,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? theme.colors.surfaceRaised : 'transparent',
      })}
      {...rest}
    >
      <Icon size={size} color={theme.colors[color]} strokeWidth={2} />
    </Pressable>
  );
}
