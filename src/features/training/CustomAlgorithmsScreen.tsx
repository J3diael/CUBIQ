import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Plus, Shapes } from 'lucide-react-native';

import { Button, Card, Divider, EmptyState, Screen, SectionHeader, Text } from '@/components/ui';
import { getCase } from '@/content/algorithms';
import {
  customCaseKey,
  listCustomAlgorithms,
  listProgress,
  type CustomAlgorithm,
} from '@/database/repositories/training-repository';
import { MASTERY_LABELS, masteryLevel } from '@/lib/training/srs';
import { useDbQuery } from '@/store/data-store';
import { useTheme } from '@/theme';

import { training } from './actions';
import { CaseRow } from './components/CaseRow';
import { CustomAlgorithmSheet } from './components/CustomAlgorithmSheet';
import { progressFor } from './progress';

const UNSORTED = 'No collection';

/** The user's own algorithms: their own sets (COLL, Roux, ZZ…) and alternatives for built-in cases. */
export function CustomAlgorithmsScreen() {
  const theme = useTheme();
  const custom = useDbQuery(listCustomAlgorithms);
  const progress = useDbQuery(listProgress);
  const [sheet, setSheet] = useState<{ editing: CustomAlgorithm | null } | null>(null);

  const standalone = custom.filter((a) => a.caseId === null);
  const alternatives = custom.filter((a) => a.caseId !== null);
  const collections = new Map<string, CustomAlgorithm[]>();
  for (const a of standalone) {
    const name = a.collection ?? UNSORTED;
    collections.set(name, [...(collections.get(name) ?? []), a]);
  }
  // Named collections in alphabetical order, the unsorted ones last.
  const groups = [...collections.entries()].sort(([a], [b]) =>
    a === UNSORTED ? 1 : b === UNSORTED ? -1 : a.localeCompare(b),
  );

  return (
    <Screen edges={[]}>
      <Text variant="body" color="textSecondary">
        Save algorithms that CUBIQ doesn&apos;t include, such as COLL, Roux or ZZ steps, and
        practise them with flashcards.
      </Text>
      <Button
        label="New algorithm"
        icon={Plus}
        fullWidth
        onPress={() => setSheet({ editing: null })}
      />

      {custom.length === 0 ? (
        <EmptyState
          icon={Shapes}
          title="No algorithms yet"
          message="Algorithms you add appear here. You can also add alternatives from any F2L, OLL or PLL case."
        />
      ) : null}

      {groups.map(([name, algs]) => (
        <View key={name} style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={name} />
          <Card flush>
            {algs.map((a, i) => (
              <View key={a.id}>
                {i > 0 ? <Divider /> : null}
                <CaseRow
                  name={a.name}
                  algorithm={a.algorithm}
                  set={a.set}
                  status={
                    progressFor(progress, customCaseKey(a.id)).reviews > 0
                      ? MASTERY_LABELS[masteryLevel(progressFor(progress, customCaseKey(a.id)))]
                      : undefined
                  }
                  onPress={() => setSheet({ editing: a })}
                />
              </View>
            ))}
          </Card>
        </View>
      ))}

      {standalone.length > 0 ? (
        <Button
          label="Practise with flashcards"
          variant="secondary"
          fullWidth
          onPress={() => router.push({ pathname: '/train/flashcards', params: { set: 'custom' } })}
        />
      ) : null}

      {alternatives.length > 0 ? (
        <View style={{ gap: theme.spacing.sm }}>
          <SectionHeader title="Alternatives for built-in cases" />
          <Card flush>
            {alternatives.map((a, i) => {
              const c = a.caseId ? getCase(a.caseId) : undefined;
              return (
                <View key={a.id}>
                  {i > 0 ? <Divider /> : null}
                  <CaseRow
                    name={c ? `${a.name} (${c.name})` : a.name}
                    algorithm={a.algorithm}
                    diagramAlgorithm={c?.algorithms[0]}
                    set={c?.set ?? a.set}
                    onPress={() =>
                      c
                        ? router.push({
                            pathname: '/train/case/[caseId]',
                            params: { caseId: c.id },
                          })
                        : setSheet({ editing: a })
                    }
                  />
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}

      {sheet ? (
        <CustomAlgorithmSheet
          visible
          existing={sheet.editing}
          onClose={() => setSheet(null)}
          onSave={(input) =>
            sheet.editing
              ? training.updateCustom(sheet.editing.id, input)
              : training.createCustom(input)
          }
          onDelete={sheet.editing ? () => training.deleteCustom(sheet.editing!.id) : undefined}
        />
      ) : null}
    </Screen>
  );
}
