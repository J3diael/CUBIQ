import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface ScreenProps {
  children: ReactNode;
  /** Large title shown at the top of the screen. */
  title?: string;
  subtitle?: string;
  /** Element shown to the right of the title, such as an icon button. */
  headerAction?: ReactNode;
  scroll?: boolean;
  /** Safe-area edges to pad. Tab screens skip the bottom edge because the tab bar handles it. */
  edges?: Edge[];
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  title,
  subtitle,
  headerAction,
  scroll = true,
  edges = ['top'],
  contentStyle,
}: ScreenProps) {
  const theme = useTheme();
  const padding = { padding: theme.spacing.md, gap: theme.spacing.lg };

  const header = title ? (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text variant="display" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {headerAction}
    </View>
  ) : null;

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[padding, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, padding, contentStyle]}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerText: { flex: 1, gap: 4 },
});
