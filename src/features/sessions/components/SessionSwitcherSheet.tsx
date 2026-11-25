import { View } from 'react-native';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';

import { Button, Card, Divider, ListRow, Sheet } from '@/components/ui';
import { listSessions } from '@/database/repositories/sessions-repository';
import { useDataStore, useDbQuery } from '@/store/data-store';
import { useTheme } from '@/theme';

import { sessionSubtitle } from '../format';

interface SessionSwitcherSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Picks which session new solves go into. Opened from the session chip on the timer. */
export function SessionSwitcherSheet({ visible, onClose }: SessionSwitcherSheetProps) {
  const theme = useTheme();
  const sessions = useDbQuery(listSessions);
  const activeId = useDataStore((s) => s.activeSessionId);
  const setActive = useDataStore((s) => s.setActiveSession);

  return (
    <Sheet visible={visible} onClose={onClose} title="Choose session">
      <Card flush>
        {sessions.map((session, index) => (
          <View key={session.id}>
            {index > 0 ? <Divider /> : null}
            <ListRow
              title={session.name}
              subtitle={sessionSubtitle(session)}
              showChevron={false}
              trailing={
                session.id === activeId ? (
                  <Check size={20} color={theme.colors.accent} accessibilityLabel="Active" />
                ) : null
              }
              onPress={() => {
                setActive(session.id);
                onClose();
              }}
            />
          </View>
        ))}
      </Card>
      <Button
        label="Manage sessions"
        variant="secondary"
        fullWidth
        onPress={() => {
          onClose();
          router.navigate('/sessions');
        }}
      />
    </Sheet>
  );
}
