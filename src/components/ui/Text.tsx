import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme, type ColorToken, type TypographyVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: TextStyle['textAlign'];
}

export function Text({
  variant = 'body',
  color = 'textPrimary',
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[theme.typography[variant], { color: theme.colors[color], textAlign: align }, style]}
      {...rest}
    />
  );
}
