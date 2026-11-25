import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { formatDuration } from '@/lib/time/format';
import { useTheme } from '@/theme';

interface ExecutionTimerProps {
  best: number | null;
  last: number | null;
  count: number;
  onRecord: (ms: number) => void;
}

const now = () => performance.now();

/**
 * Times one execution of an algorithm: tap to start, tap again to stop. Uses the same
 * monotonic clock as the main timer. Only the result is saved.
 */
export function ExecutionTimer({ best, last, count, onRecord }: ExecutionTimerProps) {
  const theme = useTheme();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);

  const onPress = () => {
    const at = now();
    if (startedAt === null) {
      setStartedAt(at);
      setResult(null);
      return;
    }
    const ms = Math.round(at - startedAt);
    setStartedAt(null);
    if (ms > 0) {
      setResult(ms);
      onRecord(ms);
    }
  };

  const running = startedAt !== null;
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={running ? 'Stop execution timer' : 'Start execution timer'}
        onPress={onPress}
        style={({ pressed }) => ({
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 96,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: running ? theme.colors.accent : theme.colors.border,
          backgroundColor: pressed ? theme.colors.surfaceRaised : theme.colors.surface,
          gap: 4,
        })}
      >
        <Text variant="stat">
          {running ? 'Timing…' : result !== null ? formatDuration(result, 2) : 'Tap to start'}
        </Text>
        <Text variant="caption" color="textSecondary">
          {running ? 'Tap when you finish the algorithm' : 'Do the algorithm once, then tap again'}
        </Text>
      </Pressable>
      <Text variant="caption" color="textSecondary" align="center">
        {count === 0
          ? 'No executions timed yet'
          : `Best ${formatDuration(best ?? 0, 2)} · Last ${formatDuration(last ?? 0, 2)} · ${count} timed`}
      </Text>
    </View>
  );
}
