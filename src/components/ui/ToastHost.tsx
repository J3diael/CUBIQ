import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUiStore } from '@/store/ui-store';
import { useTheme } from '@/theme';

import { Text } from './Text';

const VISIBLE_MS = 5000;
/** Keeps the toast above the floating tab bar. */
const TAB_BAR_CLEARANCE = 88;

/** Shows the current toast from the UI store. Rendered once, at the root of the app. */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useUiStore((s) => s.toast);
  const hideToast = useUiStore((s) => s.hideToast);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => hideToast(toast.id), VISIBLE_MS);
    return () => clearTimeout(timeout);
  }, [toast, hideToast]);

  if (!toast) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { bottom: insets.bottom + TAB_BAR_CLEARANCE, padding: theme.spacing.md },
      ]}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          {
            backgroundColor: theme.colors.surfaceRaised,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            gap: theme.spacing.md,
          },
        ]}
      >
        <Text variant="bodyStrong" style={styles.message}>
          {toast.message}
        </Text>
        {toast.actionLabel && toast.onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={toast.actionLabel}
            hitSlop={8}
            onPress={() => {
              toast.onAction?.();
              hideToast(toast.id);
            }}
          >
            <Text variant="bodyStrong" color="accent">
              {toast.actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0 },
  toast: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  message: { flex: 1 },
});
