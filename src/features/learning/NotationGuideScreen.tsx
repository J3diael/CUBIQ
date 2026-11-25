import { View } from 'react-native';

import { CubeDiagram } from '@/components/cube/CubeDiagram';
import { Card, Divider, Screen, SectionHeader, Text } from '@/components/ui';
import { NOTATION_GUIDE } from '@/content/lessons';
import { useTheme } from '@/theme';

/** Every kind of move, each with a before and after picture from the cube model. */
export function NotationGuideScreen() {
  const theme = useTheme();
  return (
    <Screen edges={[]}>
      <Text variant="body" color="textSecondary">
        Algorithms are written as a list of moves, read left to right. The faded parts of each
        picture don&apos;t move.
      </Text>
      {NOTATION_GUIDE.map((group) => (
        <View key={group.title} style={{ gap: theme.spacing.sm }}>
          <SectionHeader title={group.title} />
          <Text variant="caption" color="textSecondary">
            {group.intro}
          </Text>
          <Card flush>
            {group.entries.map((e, i) => (
              <View key={e.move}>
                {i > 0 ? <Divider /> : null}
                <View
                  accessible
                  accessibilityLabel={`${e.move}, ${e.name}. ${e.description}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.md,
                  }}
                >
                  <Text
                    variant="title"
                    style={{ fontFamily: theme.typography.stat.fontFamily, minWidth: 44 }}
                  >
                    {e.move}
                  </Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{e.name}</Text>
                    <Text variant="caption" color="textSecondary">
                      {e.description}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <CubeDiagram
                      spec={{ highlightMove: e.layer }}
                      size={52}
                      accessibilityLabel={`Before ${e.move}`}
                    />
                    <Text variant="caption" color="textSecondary">
                      Before
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <CubeDiagram
                      spec={{ setup: e.move, highlightMove: e.layer }}
                      size={52}
                      accessibilityLabel={`After ${e.move}`}
                    />
                    <Text variant="caption" color="textSecondary">
                      After
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}
