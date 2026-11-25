import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Check, Pencil, SearchX, Star, Trash2 } from 'lucide-react-native';

import { CaseDiagram } from '@/components/cube/CaseDiagram';
import {
  Button,
  Card,
  Divider,
  EmptyState,
  IconButton,
  Screen,
  SectionHeader,
  SegmentedControl,
  Text,
  TextField,
} from '@/components/ui';
import { ALGORITHM_SETS, getCase } from '@/content/algorithms';
import {
  getProgress,
  listCustomAlgorithmsForCase,
  type CustomAlgorithm,
} from '@/database/repositories/training-repository';
import type { LearningStatus } from '@/database/schema';
import { moveCount } from '@/lib/cube/notation';
import { formatSolveDate } from '@/lib/time/date';
import { MASTERY_LABELS, masteryLevel, masteryScore } from '@/lib/training/srs';
import { useNow } from '@/hooks/use-now';
import { useDbQuery } from '@/store/data-store';
import { useTheme } from '@/theme';

import { training } from './actions';
import { CustomAlgorithmSheet } from './components/CustomAlgorithmSheet';
import { ExecutionTimer } from './components/ExecutionTimer';
import { chosenAlgorithm } from './progress';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Not started' },
  { value: 'learning', label: 'Learning' },
  { value: 'learned', label: 'Learned' },
] as const satisfies readonly { value: LearningStatus; label: string }[];

export function CaseDetailScreen() {
  const theme = useTheme();
  const { caseId = '' } = useLocalSearchParams<{ caseId: string }>();
  const c = getCase(caseId);
  const progress = useDbQuery((db) => getProgress(db, caseId));
  const custom = useDbQuery((db) => listCustomAlgorithmsForCase(db, caseId));
  const [sheet, setSheet] = useState<{ editing: CustomAlgorithm | null } | null>(null);
  const [notes, setNotes] = useState(progress.notes ?? '');
  const now = useNow();

  if (!c) {
    return (
      <Screen edges={[]}>
        <EmptyState
          icon={SearchX}
          title="Case not found"
          message="It may have been renamed."
          actionLabel="Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const set = ALGORITHM_SETS[c.set];
  const group = set.groups.find((g) => g.name === c.group);
  const chosen = chosenAlgorithm(
    c,
    progress,
    custom.map((a) => a.algorithm),
  );
  const options = [
    ...c.algorithms.map((alg, i) => ({
      alg,
      label: i === 0 ? 'Recommended' : 'Alternative',
      custom: null,
    })),
    ...custom.map((a) => ({ alg: a.algorithm, label: a.name, custom: a })),
  ];
  const level = masteryLevel(progress);
  const score = masteryScore(progress);
  const accuracy = progress.reviews
    ? Math.round((progress.correct / progress.reviews) * 100)
    : null;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: `${set.name} · ${c.name}` }} />

      <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
        <CaseDiagram
          algorithm={c.algorithms[0]}
          set={c.set}
          size={168}
          accessibilityLabel={`${set.name} ${c.name} case`}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          <Text variant="title">{c.name}</Text>
          <IconButton
            icon={Star}
            accessibilityLabel={
              progress.isFavorite ? 'Remove from favourites' : 'Add to favourites'
            }
            color={progress.isFavorite ? 'warning' : 'textSecondary'}
            onPress={() => training.setFavorite(c.id, !progress.isFavorite)}
          />
        </View>
        <Text variant="caption" color="textSecondary" align="center">
          {c.group}
          {group ? ` · ${group.description}` : ''}
        </Text>
        {c.recognition ? (
          <Text variant="body" align="center">
            {c.recognition}
          </Text>
        ) : null}
      </View>

      <SegmentedControl
        accessibilityLabel="Learning status"
        options={STATUS_OPTIONS}
        value={progress.status}
        onChange={(status) => training.setStatus(c.id, status)}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Algorithms" />
        <Card flush>
          {options.map((o, i) => {
            const selected = o.alg === chosen;
            return (
              <View key={`${o.alg}-${i}`}>
                {i > 0 ? <Divider /> : null}
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${o.label}: ${o.alg}`}
                  onPress={() => training.setPreferred(c.id, i === 0 ? null : o.alg)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.md,
                  }}
                >
                  <View style={{ width: 20 }}>
                    {selected ? <Check size={20} color={theme.colors.accent} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      variant="heading"
                      selectable
                      style={{ fontFamily: theme.typography.stat.fontFamily, lineHeight: 26 }}
                    >
                      {o.alg}
                    </Text>
                    <Text variant="caption" color="textSecondary">
                      {`${o.label} · ${moveCount(o.alg)} moves`}
                    </Text>
                  </View>
                  {o.custom ? (
                    <View style={{ flexDirection: 'row' }}>
                      <IconButton
                        icon={Pencil}
                        accessibilityLabel={`Edit ${o.label}`}
                        size={18}
                        color="textSecondary"
                        onPress={() => setSheet({ editing: o.custom })}
                      />
                      <IconButton
                        icon={Trash2}
                        accessibilityLabel={`Delete ${o.label}`}
                        size={18}
                        color="danger"
                        onPress={() => training.deleteCustom(o.custom!.id)}
                      />
                    </View>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </Card>
        <Text variant="caption" color="textSecondary">
          Tap an algorithm to learn it; flashcards will show your choice.
        </Text>
        <Button
          label="Add your own algorithm"
          variant="ghost"
          onPress={() => setSheet({ editing: null })}
        />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Practise execution" />
        <ExecutionTimer
          best={progress.bestExecutionMs}
          last={progress.lastExecutionMs}
          count={progress.executions}
          onRecord={(ms) => training.execution(c.id, ms)}
        />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Mastery" />
        <Card style={{ gap: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="bodyStrong">{MASTERY_LABELS[level]}</Text>
            <Text variant="bodyStrong" color="accent">{`${score}%`}</Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: score }}
            style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceRaised }}
          >
            <View
              style={{
                width: `${score}%`,
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.colors.accent,
              }}
            />
          </View>
          <Text variant="caption" color="textSecondary">
            {progress.reviews === 0
              ? 'Practise this case with flashcards to build mastery.'
              : `${progress.reviews} reviews · ${accuracy}% recalled${progress.dueAt ? ` · next review ${progress.dueAt <= now ? 'now' : formatSolveDate(progress.dueAt)}` : ''}`}
          </Text>
        </Card>
      </View>

      <TextField
        label="Notes"
        multiline
        value={notes}
        onChangeText={setNotes}
        onBlur={() => {
          if ((progress.notes ?? '') !== notes.trim()) training.setNotes(c.id, notes);
        }}
        placeholder="Fingertricks, recognition tips…"
        maxLength={500}
      />

      {sheet ? (
        <CustomAlgorithmSheet
          visible
          existing={sheet.editing}
          forCase={{ id: c.id, name: c.name, set: c.set }}
          onClose={() => setSheet(null)}
          onSave={(input) =>
            sheet.editing
              ? training.updateCustom(sheet.editing.id, input)
              : training.createCustom(input)
          }
        />
      ) : null}
    </Screen>
  );
}
