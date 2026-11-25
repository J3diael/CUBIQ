import { Layers } from 'lucide-react-native';

import { Card, EmptyState, Screen } from '@/components/ui';

export function SessionsScreen() {
  return (
    <Screen title="Sessions" subtitle="Organise solves by puzzle, goal or competition">
      <Card>
        <EmptyState
          icon={Layers}
          title="No sessions yet"
          message="Sessions group your solves so you can compare practice days, goals and puzzles. Creating sessions arrives in Phase 3."
        />
      </Card>
    </Screen>
  );
}
