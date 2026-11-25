import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';

import { Button, IconButton, Text } from '@/components/ui';
import type { ScrambleState } from '@/features/scrambles/use-scramble';
import { useTheme } from '@/theme';

interface ScrambleCardProps {
  scramble: ScrambleState;
  onNewScramble: () => void;
}

export function ScrambleCard({ scramble, onNewScramble }: ScrambleCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          padding: theme.spacing.md,
          paddingRight: theme.spacing.xs,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          gap: theme.spacing.xs,
        },
      ]}
    >
      <View style={styles.body}>
        {scramble.status === 'ready' ? (
          <Text
            variant="heading"
            align="center"
            selectable
            accessibilityLabel={`Scramble: ${scramble.scramble.notation}`}
            style={[styles.notation, { fontFamily: theme.typography.stat.fontFamily }]}
          >
            {scramble.scramble.notation}
          </Text>
        ) : scramble.status === 'loading' ? (
          <View style={styles.row}>
            <ActivityIndicator color={theme.colors.textSecondary} />
            <Text variant="body" color="textSecondary">
              Generating scramble…
            </Text>
          </View>
        ) : (
          <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
            <Text variant="body" color="danger" align="center">
              Couldn&apos;t generate a scramble. You can still time solves.
            </Text>
            <Button label="Try again" variant="ghost" onPress={onNewScramble} />
          </View>
        )}
      </View>
      <IconButton
        icon={RefreshCw}
        accessibilityLabel="New scramble"
        color="textSecondary"
        size={20}
        onPress={onNewScramble}
        disabled={scramble.status === 'loading'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, minHeight: 88 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notation: { letterSpacing: 0.5, lineHeight: 28 },
});
