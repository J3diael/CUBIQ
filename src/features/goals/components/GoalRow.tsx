import { Pressable, View } from 'react-native';
import { Trophy } from 'lucide-react-native';

import { Text } from '@/components/ui';
import { formatSolveDate } from '@/lib/time/date';
import { useTheme } from '@/theme';

import type { GoalWithProgress } from '../queries';

/** A goal with its progress bar, or the date it was reached. */
export function GoalRow({ goal, onPress }: { goal: GoalWithProgress; onPress: () => void }) {
  const theme = useTheme();
  const { progress } = goal;
  const completed = goal.completedAt !== null;
  const percent = Math.round(progress.fraction * 100);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${goal.title}. ${completed ? 'Reached' : progress.text}`}
      onPress={onPress}
      style={({ pressed }) => ({
        padding: theme.spacing.md,
        gap: theme.spacing.xs,
        backgroundColor: pressed ? theme.colors.surfaceRaised : 'transparent',
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        {completed ? <Trophy size={16} color={theme.colors.warning} /> : null}
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {goal.title}
        </Text>
        {!completed && goal.type !== 'custom' ? (
          <Text variant="label" color="accent">{`${percent}%`}</Text>
        ) : null}
      </View>
      {completed ? (
        <Text variant="caption" color="textSecondary">
          {`Reached ${formatSolveDate(goal.completedAt!)}`}
        </Text>
      ) : (
        <>
          {goal.type !== 'custom' ? (
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: percent }}
              style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceRaised }}
            >
              <View
                style={{
                  width: `${percent}%`,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: progress.done ? theme.colors.success : theme.colors.accent,
                }}
              />
            </View>
          ) : null}
          <Text variant="caption" color="textSecondary">
            {progress.text}
          </Text>
        </>
      )}
    </Pressable>
  );
}
