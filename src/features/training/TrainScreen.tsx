import { View } from 'react-native';
import { BookOpen, Box, Grid3x3, Layers2, Shapes, Sparkles } from 'lucide-react-native';

import { Card, Chip, Divider, ListRow, Screen, SectionHeader } from '@/components/ui';
import { useTheme } from '@/theme';

/**
 * Training hub layout. Rows are not pressable yet because their content doesn't exist;
 * each chip says honestly when it arrives.
 */
export function TrainScreen() {
  const theme = useTheme();

  return (
    <Screen title="Train" subtitle="Learn algorithms and build speed">
      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="CFOP" />
        <Card flush>
          <ListRow
            title="Cross"
            subtitle="Plan and solve the first-layer cross"
            icon={Shapes}
            trailing={<Chip label="Phase 5" />}
          />
          <Divider inset={48} />
          <ListRow
            title="F2L"
            subtitle="41 cases"
            icon={Layers2}
            trailing={<Chip label="Phase 5" />}
          />
          <Divider inset={48} />
          <ListRow
            title="OLL"
            subtitle="57 cases"
            icon={Grid3x3}
            trailing={<Chip label="Phase 5" />}
          />
          <Divider inset={48} />
          <ListRow title="PLL" subtitle="21 cases" icon={Box} trailing={<Chip label="Phase 5" />} />
        </Card>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Learn" />
        <Card flush>
          <ListRow
            title="Beginner course"
            subtitle="Notation, layers and your first full solve"
            icon={BookOpen}
            trailing={<Chip label="Phase 6" />}
          />
        </Card>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Other methods" />
        <Card flush>
          <ListRow title="Roux" icon={Sparkles} trailing={<Chip label="Later" />} />
          <Divider inset={48} />
          <ListRow title="ZZ" icon={Sparkles} trailing={<Chip label="Later" />} />
        </Card>
      </View>
    </Screen>
  );
}
