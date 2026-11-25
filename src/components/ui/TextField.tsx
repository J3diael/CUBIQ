import { TextInput, View, type TextInputProps } from 'react-native';

import { touchTarget, useTheme } from '@/theme';

import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Validation message shown under the field. */
  error?: string | null;
  hint?: string;
  /** Large monospaced text, for typing times. */
  mono?: boolean;
}

export function TextField({
  label,
  error,
  hint,
  mono = false,
  multiline,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const message = error ?? hint;
  return (
    <View style={{ gap: theme.spacing.xxs }}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.textSecondary}
        selectionColor={theme.colors.accent}
        multiline={multiline}
        style={[
          mono ? theme.typography.stat : theme.typography.body,
          {
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.surfaceRaised,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            minHeight: multiline ? touchTarget * 2 : touchTarget + 4,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
        {...rest}
      />
      {message ? (
        <Text variant="caption" color={error ? 'danger' : 'textSecondary'}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
