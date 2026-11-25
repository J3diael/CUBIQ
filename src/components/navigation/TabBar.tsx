import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import {
  CircleUser,
  GraduationCap,
  House,
  Layers,
  Timer,
  type LucideProps,
} from 'lucide-react-native';

import { Text } from '@/components/ui';
import { touchTarget, useTheme } from '@/theme';

interface TabConfig {
  label: string;
  icon: ComponentType<LucideProps>;
}

/** Route name → label and icon. Order of tabs comes from the navigator in `(tabs)/_layout.tsx`. */
export const TAB_CONFIG: Record<string, TabConfig> = {
  index: { label: 'Home', icon: House },
  sessions: { label: 'Sessions', icon: Layers },
  timer: { label: 'Timer', icon: Timer },
  train: { label: 'Train', icon: GraduationCap },
  profile: { label: 'Profile', icon: CircleUser },
};

export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, theme.spacing.xs),
          paddingTop: theme.spacing.xs,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;
        const focused = state.index === index;
        const color = focused ? theme.colors.accent : theme.colors.textSecondary;
        const Icon = config.icon;

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={config.label}
            accessibilityState={{ selected: focused }}
            testID={`tab-${route.name}`}
            onPress={onPress}
            style={styles.tab}
          >
            <View
              style={[
                styles.iconPill,
                { borderRadius: theme.radius.full },
                focused && { backgroundColor: theme.colors.accentMuted },
              ]}
            >
              <Icon size={22} color={color} strokeWidth={focused ? 2.25 : 2} />
            </View>
            <Text variant="label" style={{ color, fontSize: 11, lineHeight: 14 }}>
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: touchTarget },
  iconPill: { width: 56, height: 30, alignItems: 'center', justifyContent: 'center' },
});
