import { useState } from 'react';
import { View } from 'react-native';

import { Button, Sheet, Text, TextField } from '@/components/ui';
import { PUZZLE_ORDER, PUZZLES, type PuzzleId } from '@/constants/puzzles';
import {
  goalInputSchema,
  type Goal,
  type GoalInput,
} from '@/database/repositories/goals-repository';
import type { GoalStat, GoalType } from '@/database/schema';
import { OptionChips } from '@/features/sessions/components/OptionChips';
import { formatTarget, parseTargetTime } from '@/lib/goals/goals';
import { useTheme } from '@/theme';

const TYPE_LABELS: Record<GoalType, string> = {
  time: 'Beat a time',
  solves: 'Solve count',
  daily: 'Daily solves',
  streak: 'Practice streak',
  algorithms: 'Learn a set',
  custom: 'Something else',
};

const TYPE_HELP: Record<GoalType, string> = {
  time: 'Reached when your best is under the target, e.g. sub-20.',
  solves: 'Counts solves from today on.',
  daily: 'A target for every day, shown on Home. It never finishes.',
  streak: 'Days in a row with at least one solve.',
  algorithms: 'Reached when every case in the set is marked learned.',
  custom: 'Like "Improve F2L". You mark it done yourself.',
};

const STAT_LABELS: Record<GoalStat, string> = { single: 'Single', ao5: 'Ao5', ao12: 'Ao12' };
const SET_LABELS = { f2l: 'F2L', oll: 'OLL', pll: 'PLL' } as const;
const PUZZLE_LABELS = Object.fromEntries(
  PUZZLE_ORDER.map((id) => [id, PUZZLES[id].shortName]),
) as Record<PuzzleId, string>;

interface GoalFormSheetProps {
  visible: boolean;
  existing?: Goal | null;
  onClose: () => void;
  onSave: (input: GoalInput) => void;
  onDelete?: () => void;
  /** Mark a custom goal done or open again. */
  onToggleDone?: () => void;
}

export function GoalFormSheet({
  visible,
  existing,
  onClose,
  onSave,
  onDelete,
  onToggleDone,
}: GoalFormSheetProps) {
  const theme = useTheme();
  const [type, setType] = useState<GoalType>(existing?.type ?? 'time');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [count, setCount] = useState(
    existing && existing.type !== 'time' && existing.target ? String(existing.target) : '',
  );
  const [time, setTime] = useState(
    existing?.type === 'time' && existing.target ? formatTarget(existing.target) : '',
  );
  const [puzzleId, setPuzzleId] = useState<PuzzleId>((existing?.puzzleId as PuzzleId) ?? '333');
  const [stat, setStat] = useState<GoalStat>(existing?.stat ?? 'single');
  const [algorithmSet, setAlgorithmSet] = useState<'f2l' | 'oll' | 'pll'>(
    (existing?.algorithmSet as 'f2l' | 'oll' | 'pll') ?? 'pll',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = () => {
    const target =
      type === 'time'
        ? (parseTargetTime(time) ?? undefined)
        : count.trim()
          ? Number(count)
          : undefined;
    const input: GoalInput = {
      type,
      // A title left as the generated one is regenerated, so it follows the target.
      title: existing && title === existing.title && type !== 'custom' ? null : title,
      notes,
      target: Number.isInteger(target) ? target : undefined,
      puzzleId,
      stat,
      algorithmSet,
    };
    const parsed = goalInputSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    onSave(input);
    onClose();
  };

  const countLabel =
    type === 'solves' ? 'Number of solves' : type === 'daily' ? 'Solves each day' : 'Days in a row';

  return (
    <Sheet visible={visible} onClose={onClose} title={existing ? 'Edit goal' : 'New goal'}>
      <View style={{ gap: theme.spacing.md }}>
        <OptionChips
          label="Kind of goal"
          options={TYPE_LABELS}
          value={type}
          onChange={(v) => {
            if (v) setType(v);
            setErrors({});
          }}
        />
        <Text variant="caption" color="textSecondary">
          {TYPE_HELP[type]}
        </Text>

        {type === 'time' ? (
          <>
            <OptionChips
              label="Puzzle"
              options={PUZZLE_LABELS}
              value={puzzleId}
              onChange={(v) => setPuzzleId(v ?? puzzleId)}
            />
            <OptionChips
              label="Result"
              options={STAT_LABELS}
              value={stat}
              onChange={(v) => setStat(v ?? stat)}
            />
            <TextField
              label="Target time"
              mono
              value={time}
              onChangeText={setTime}
              placeholder="20"
              keyboardType="numbers-and-punctuation"
              hint="Seconds, or minutes and seconds: 20, 15.5, 1:30"
              error={errors.target}
            />
          </>
        ) : null}

        {type === 'solves' || type === 'daily' || type === 'streak' ? (
          <TextField
            label={countLabel}
            value={count}
            onChangeText={(v) => setCount(v.replace(/[^0-9]/g, ''))}
            placeholder={type === 'solves' ? '100' : type === 'daily' ? '25' : '7'}
            keyboardType="number-pad"
            error={errors.target}
          />
        ) : null}

        {type === 'algorithms' ? (
          <OptionChips
            label="Set"
            options={SET_LABELS}
            value={algorithmSet}
            onChange={(v) => setAlgorithmSet(v ?? algorithmSet)}
          />
        ) : null}

        <TextField
          label={type === 'custom' ? 'Goal' : 'Name (optional)'}
          value={title}
          onChangeText={setTitle}
          placeholder={
            type === 'custom'
              ? 'e.g. Improve my F2L'
              : 'Leave empty for a name like "Sub-20 3x3 single"'
          }
          maxLength={60}
          error={errors.title}
        />
        <TextField
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={500}
        />

        <Button label="Save goal" fullWidth onPress={save} />
        {existing && existing.type === 'custom' && onToggleDone ? (
          <Button
            label={existing.completedAt ? 'Mark as not done' : 'Mark as done'}
            variant="secondary"
            fullWidth
            onPress={() => {
              onClose();
              onToggleDone();
            }}
          />
        ) : null}
        {existing && onDelete ? (
          <Button
            label="Delete goal"
            variant="ghost"
            fullWidth
            onPress={() => {
              onClose();
              onDelete();
            }}
          />
        ) : null}
      </View>
    </Sheet>
  );
}
