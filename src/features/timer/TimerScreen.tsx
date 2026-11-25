import { StyleSheet, View } from 'react-native';

import { Chip, Screen, Text } from '@/components/ui';
import { formatDuration } from '@/lib/time/format';
import { useTheme } from '@/theme';

/**
 * Timer layout. The timer engine, hold-to-start and scrambles arrive in Phase 2,
 * so this screen shows the final layout without pretending to time anything.
 */
export function TimerScreen() {
  const theme = useTheme();

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <Chip label="3x3 · No session yet" selected />
      </View>

      <View
        style={[
          styles.scramble,
          {
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Text variant="overline" color="textSecondary">
          Scramble
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          Scramble generation arrives in Phase 2.
        </Text>
      </View>

      <View style={styles.timerArea}>
        <Text
          variant="timer"
          align="center"
          accessibilityRole="timer"
          accessibilityLabel="Timer, zero seconds"
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {formatDuration(0)}
        </Text>
        <Text variant="caption" color="textSecondary" align="center">
          Hold to start will be enabled in Phase 2
        </Text>
      </View>

      <View style={[styles.statsRow, { gap: theme.spacing.lg }]}>
        <MiniStat label="Ao5" />
        <MiniStat label="Ao12" />
        <MiniStat label="Solves" value="0" />
      </View>
    </Screen>
  );
}

function MiniStat({ label, value = '—' }: { label: string; value?: string }) {
  return (
    <View style={styles.miniStat}>
      <Text variant="overline" color="textSecondary">
        {label}
      </Text>
      <Text variant="stat">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', justifyContent: 'center' },
  scramble: { alignItems: 'center', gap: 6 },
  timerArea: { flex: 1, justifyContent: 'center', gap: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'center' },
  miniStat: { alignItems: 'center', gap: 2, minWidth: 72 },
});
