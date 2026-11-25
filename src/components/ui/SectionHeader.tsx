import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './Text';

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="overline" color="textSecondary" accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}
