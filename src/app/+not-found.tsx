import { router } from 'expo-router';
import { SearchX } from 'lucide-react-native';

import { EmptyState, Screen } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <Screen edges={[]}>
      <EmptyState
        icon={SearchX}
        title="This screen doesn't exist"
        message="The link you followed may be broken."
        actionLabel="Go to Home"
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
