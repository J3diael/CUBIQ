import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Layers } from 'lucide-react-native';

import { CaseDiagram } from '@/components/cube/CaseDiagram';
import { Button, Card, Chip, EmptyState, Screen, Text } from '@/components/ui';
import { ALGORITHM_SET_ORDER, ALGORITHM_SETS } from '@/content/algorithms';
import {
  customCaseKey,
  listCustomAlgorithms,
  listProgress,
  type CustomAlgorithm,
} from '@/database/repositories/training-repository';
import { buildFlashcardQueue, type FlashcardFilter } from '@/lib/training/queue';
import { nextIntervalLabel, type Grade } from '@/lib/training/srs';
import { useNow } from '@/hooks/use-now';
import { useDbQuery } from '@/store/data-store';
import { useTheme } from '@/theme';

import { training } from './actions';
import { chosenAlgorithm, progressFor, type ProgressMap } from './progress';

type Deck = 'f2l' | 'oll' | 'pll' | 'custom';
const DECKS: { value: Deck; label: string }[] = [
  ...ALGORITHM_SET_ORDER.map((id) => ({ value: id as Deck, label: ALGORITHM_SETS[id].name })),
  { value: 'custom', label: 'My algorithms' },
];
const FILTERS: { value: FlashcardFilter; label: string }[] = [
  { value: 'due', label: 'Due and new' },
  { value: 'learning', label: 'Learning' },
  { value: 'favorites', label: 'Favourites' },
  { value: 'all', label: 'All' },
];
const GRADES: { grade: Grade; label: string; variant: 'secondary' | 'primary' }[] = [
  { grade: 'again', label: 'Again', variant: 'secondary' },
  { grade: 'hard', label: 'Hard', variant: 'secondary' },
  { grade: 'good', label: 'Good', variant: 'primary' },
  { grade: 'easy', label: 'Easy', variant: 'secondary' },
];

/** Wall-clock time, read only in event handlers. */
const timestamp = () => Date.now();

const isDeck = (v: unknown): v is Deck => DECKS.some((d) => d.value === v);

/** What a card shows: the case picture first, then the name and algorithm. */
interface CardFace {
  key: string;
  name: string;
  subtitle: string;
  diagramAlgorithm: string;
  diagramSet: 'f2l' | 'oll' | 'pll' | 'other';
  answer: string;
}

function cardFaces(deck: Deck, progress: ProgressMap, custom: CustomAlgorithm[]): CardFace[] {
  if (deck === 'custom') {
    return custom
      .filter((a) => a.caseId === null)
      .map((a) => ({
        key: customCaseKey(a.id),
        name: a.name,
        subtitle: a.collection ?? 'My algorithms',
        diagramAlgorithm: a.algorithm,
        diagramSet: a.set,
        answer: a.algorithm,
      }));
  }
  return ALGORITHM_SETS[deck].cases.map((c) => ({
    key: c.id,
    name: `${ALGORITHM_SETS[deck].name} · ${c.name}`,
    subtitle: c.group,
    diagramAlgorithm: c.algorithms[0],
    diagramSet: c.set,
    answer: chosenAlgorithm(
      c,
      progressFor(progress, c.id),
      custom.filter((a) => a.caseId === c.id).map((a) => a.algorithm),
    ),
  }));
}

interface Round {
  queue: string[];
  index: number;
  revealed: boolean;
  shownAt: number;
  recognitionMs: number | null;
  tally: Record<Grade, number>;
}

const EMPTY_TALLY: Record<Grade, number> = { again: 0, hard: 0, good: 0, easy: 0 };

export function FlashcardsScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ set?: string }>();
  const progress = useDbQuery(listProgress);
  const custom = useDbQuery(listCustomAlgorithms);
  const [deck, setDeck] = useState<Deck>(isDeck(params.set) ? params.set : 'pll');
  const [filter, setFilter] = useState<FlashcardFilter>('due');
  const [round, setRound] = useState<Round | null>(null);
  const now = useNow();

  const faces = useMemo(() => cardFaces(deck, progress, custom), [deck, progress, custom]);
  const byKey = useMemo(() => new Map(faces.map((f) => [f.key, f])), [faces]);
  const candidates = useMemo(
    () => faces.map((f) => ({ key: f.key, progress: progressFor(progress, f.key) })),
    [faces, progress],
  );

  const start = () => {
    const at = timestamp();
    const queue = buildFlashcardQueue(candidates, filter, at);
    setRound({
      queue,
      index: 0,
      revealed: false,
      shownAt: at,
      recognitionMs: null,
      tally: EMPTY_TALLY,
    });
  };

  // Setup: pick a deck and which cards.
  if (!round) {
    const available = buildFlashcardQueue(candidates, filter, now, Infinity).length;
    return (
      <Screen edges={[]}>
        <Text variant="body" color="textSecondary">
          Look at the case, recall the algorithm, then check yourself. Cards you know come back less
          often; cards you miss come back soon.
        </Text>
        <ChipGroup label="Deck" options={DECKS} value={deck} onChange={setDeck} />
        <ChipGroup label="Cards" options={FILTERS} value={filter} onChange={setFilter} />
        {faces.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No algorithms yet"
            message="Add your own algorithms first, then practise them here."
            actionLabel="My algorithms"
            onAction={() => router.push('/train/custom')}
          />
        ) : available === 0 ? (
          <EmptyState
            icon={Layers}
            title="Nothing to review"
            message={
              filter === 'due'
                ? 'You are up to date with this deck. Pick "All" to practise anyway.'
                : 'No cards match. Try another choice.'
            }
          />
        ) : (
          <Button label={`Start · ${Math.min(available, 20)} cards`} fullWidth onPress={start} />
        )}
      </Screen>
    );
  }

  const key = round.queue[round.index];
  const face = key ? byKey.get(key) : undefined;

  // Summary at the end of a round, or if the deck changed under it.
  if (!face) {
    const total = Object.values(round.tally).reduce((a, b) => a + b, 0);
    const recalled = total - round.tally.again;
    return (
      <Screen edges={[]}>
        <Card style={{ gap: theme.spacing.sm, alignItems: 'center' }}>
          <Text variant="title">Round complete</Text>
          <Text variant="body" color="textSecondary" align="center">
            {total === 0
              ? 'No cards reviewed.'
              : `${total} reviews · ${Math.round((recalled / total) * 100)}% recalled`}
          </Text>
          <Text variant="caption" color="textSecondary" align="center">
            {`Again ${round.tally.again} · Hard ${round.tally.hard} · Good ${round.tally.good} · Easy ${round.tally.easy}`}
          </Text>
        </Card>
        <Button label="Another round" fullWidth onPress={start} />
        <Button label="Done" variant="ghost" fullWidth onPress={() => setRound(null)} />
      </Screen>
    );
  }

  const state = progressFor(progress, face.key);
  const grade = (g: Grade) => {
    training.review(face.key, g);
    setRound({
      ...round,
      // A missed card comes back at the end of this round.
      queue: g === 'again' ? [...round.queue, face.key] : round.queue,
      index: round.index + 1,
      revealed: false,
      shownAt: timestamp(),
      recognitionMs: null,
      tally: { ...round.tally, [g]: round.tally[g] + 1 },
    });
  };

  return (
    <Screen edges={[]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption" color="textSecondary">
          {`Card ${round.index + 1} of ${round.queue.length}`}
        </Text>
        <Button
          label="End round"
          variant="ghost"
          onPress={() => setRound({ ...round, index: round.queue.length })}
        />
      </View>

      <Card
        style={{ alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.lg }}
      >
        <CaseDiagram
          algorithm={face.diagramAlgorithm}
          set={face.diagramSet}
          size={200}
          accessibilityLabel="Case to recognise"
        />
        {round.revealed ? (
          <View
            style={{ alignItems: 'center', gap: theme.spacing.xs }}
            accessibilityLiveRegion="polite"
          >
            <Text variant="title" align="center">
              {face.name}
            </Text>
            <Text variant="caption" color="textSecondary" align="center">
              {face.subtitle}
            </Text>
            <Text
              variant="heading"
              align="center"
              selectable
              style={{ fontFamily: theme.typography.stat.fontFamily, lineHeight: 28 }}
            >
              {face.answer}
            </Text>
            {round.recognitionMs !== null ? (
              <Text variant="caption" color="textSecondary">
                {`Answered in ${(round.recognitionMs / 1000).toFixed(1)} s`}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text variant="body" color="textSecondary" align="center">
            Which case is this, and how do you solve it?
          </Text>
        )}
      </Card>

      {round.revealed ? (
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="caption" color="textSecondary" align="center">
            How well did you remember it?
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
            {GRADES.map((g) => (
              <View key={g.grade} style={{ flex: 1 }}>
                <Button
                  label={g.label}
                  variant={g.variant}
                  fullWidth
                  accessibilityLabel={`${g.label}, next review in ${nextIntervalLabel(state, g.grade)}`}
                  onPress={() => grade(g.grade)}
                />
                <Text variant="caption" color="textSecondary" align="center">
                  {nextIntervalLabel(state, g.grade)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Button
          label="Show answer"
          fullWidth
          onPress={() =>
            setRound({ ...round, revealed: true, recognitionMs: timestamp() - round.shownAt })
          }
        />
      )}
    </Screen>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {options.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={o.value === value}
            onPress={() => onChange(o.value)}
          />
        ))}
      </View>
    </View>
  );
}
