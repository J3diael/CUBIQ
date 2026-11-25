import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, Star } from 'lucide-react-native';

import { CaseDiagram } from '@/components/cube/CaseDiagram';
import { Text } from '@/components/ui';
import { touchTarget, useTheme } from '@/theme';

interface CaseRowProps {
  name: string;
  algorithm: string;
  /** Algorithm used to draw the case; defaults to `algorithm`. */
  diagramAlgorithm?: string;
  set: 'f2l' | 'oll' | 'pll' | 'other';
  status?: string;
  isFavorite?: boolean;
  onPress: () => void;
}

export function CaseRow({
  name,
  algorithm,
  diagramAlgorithm,
  set,
  status,
  isFavorite,
  onPress,
}: CaseRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}${status ? `, ${status}` : ''}${isFavorite ? ', favourite' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          backgroundColor: pressed ? theme.colors.surfaceRaised : 'transparent',
        },
      ]}
    >
      <CaseDiagram
        algorithm={diagramAlgorithm ?? algorithm}
        set={set}
        size={52}
        accessibilityLabel={`${name} diagram`}
      />
      <View style={styles.text}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xxs }}>
          <Text variant="bodyStrong">{name}</Text>
          {isFavorite ? (
            <Star size={14} color={theme.colors.warning} fill={theme.colors.warning} />
          ) : null}
        </View>
        <Text
          variant="caption"
          color="textSecondary"
          numberOfLines={1}
          style={{ fontFamily: theme.typography.stat.fontFamily }}
        >
          {algorithm}
        </Text>
        {status ? (
          <Text variant="caption" color={status === 'Learned' ? 'success' : 'accent'}>
            {status}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: touchTarget + 20 },
  text: { flex: 1, gap: 2 },
});
