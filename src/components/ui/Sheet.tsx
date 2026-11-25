import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { useTheme } from '@/theme';

import { IconButton } from './IconButton';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Bottom sheet built on the platform Modal. Tapping the backdrop or the close button dismisses it. */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Lifts the sheet above the keyboard when it holds a text field. */}
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.lg,
            borderTopRightRadius: theme.radius.lg,
            padding: theme.spacing.md,
            paddingBottom: theme.spacing.md + insets.bottom,
            gap: theme.spacing.md,
          }}
        >
          <View style={styles.header}>
            <Text variant="title">{title}</Text>
            <IconButton
              icon={X}
              accessibilityLabel="Close"
              onPress={onClose}
              color="textSecondary"
            />
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
