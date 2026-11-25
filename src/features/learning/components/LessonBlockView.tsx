import { View } from 'react-native';
import { Lightbulb } from 'lucide-react-native';

import { CubeDiagram } from '@/components/cube/CubeDiagram';
import { Card, Text } from '@/components/ui';
import type { LessonBlock } from '@/content/lessons';
import { moveCount } from '@/lib/cube/notation';
import { useTheme } from '@/theme';

/** Renders one block of a lesson step: text, a tip, a cube picture or an algorithm. */
export function LessonBlockView({ block }: { block: LessonBlock }) {
  const theme = useTheme();
  switch (block.type) {
    case 'text':
      return <Text variant="body">{block.text}</Text>;
    case 'tip':
      return (
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing.sm,
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.accentMuted,
          }}
        >
          <Lightbulb size={18} color={theme.colors.accent} />
          <Text variant="body" style={{ flex: 1 }}>
            {block.text}
          </Text>
        </View>
      );
    case 'diagram':
      return (
        <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
          <CubeDiagram spec={block.diagram} size={150} accessibilityLabel={block.caption} />
          <Text variant="caption" color="textSecondary" align="center">
            {block.caption}
          </Text>
        </View>
      );
    case 'algorithm':
      return (
        <Card style={{ gap: theme.spacing.xxs, alignItems: 'center' }}>
          <Text variant="overline" color="textSecondary">
            {block.name}
          </Text>
          <Text
            variant="title"
            align="center"
            selectable
            accessibilityLabel={`${block.name}: ${block.moves}`}
            style={{ fontFamily: theme.typography.stat.fontFamily }}
          >
            {block.moves}
          </Text>
          <Text variant="caption" color="textSecondary" align="center">
            {`${moveCount(block.moves)} moves${block.note ? ` · ${block.note}` : ''}`}
          </Text>
        </Card>
      );
  }
}
