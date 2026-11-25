import { StyleSheet, View } from 'react-native';
import { DatabaseZap } from 'lucide-react-native';

import { EmptyState } from '@/components/ui';
import { useTheme } from '@/theme';

/** Shown if the database can't be opened. The app never runs without storage, so solves aren't lost silently. */
export function StartupErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <EmptyState
        icon={DatabaseZap}
        title="CUBIQ couldn't open its data"
        message={`Your solves are stored on this device and nothing has been deleted. Try again, and restart the app if it keeps happening.\n\n${message}`}
        actionLabel="Try again"
        onAction={onRetry}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, justifyContent: 'center' } });
