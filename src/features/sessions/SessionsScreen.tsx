import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';

import { Card, Chip, Divider, IconButton, ListRow, Screen, Text } from '@/components/ui';
import { listSessions } from '@/database/repositories/sessions-repository';
import { useDataStore, useDbQuery } from '@/store/data-store';

import { SessionFormSheet } from './components/SessionFormSheet';
import { sessionSubtitle } from './format';

export function SessionsScreen() {
  const sessions = useDbQuery(listSessions);
  const activeId = useDataStore((s) => s.activeSessionId);
  const createSession = useDataStore((s) => s.createSession);
  const setActive = useDataStore((s) => s.setActiveSession);
  const [creating, setCreating] = useState(false);

  return (
    <Screen
      title="Sessions"
      subtitle="Group solves by goal, method or competition"
      headerAction={
        <IconButton
          icon={Plus}
          accessibilityLabel="New session"
          onPress={() => setCreating(true)}
        />
      }
    >
      <Card flush>
        {sessions.map((session, index) => (
          <View key={session.id}>
            {index > 0 ? <Divider /> : null}
            <ListRow
              title={session.name}
              subtitle={sessionSubtitle(session)}
              trailing={session.id === activeId ? <Chip label="Active" selected /> : null}
              onPress={() =>
                router.push({
                  pathname: '/sessions/[sessionId]',
                  params: { sessionId: session.id },
                })
              }
            />
          </View>
        ))}
      </Card>
      <Text variant="caption" color="textSecondary" align="center">
        New solves go into the active session. Change it here or from the timer.
      </Text>

      <SessionFormSheet
        visible={creating}
        mode="create"
        onClose={() => setCreating(false)}
        onSubmit={(values) => {
          const session = createSession(values);
          setActive(session.id);
        }}
      />
    </Screen>
  );
}
