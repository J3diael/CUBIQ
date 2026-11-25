import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/navigation/TabBar';

/** Five bottom tabs. Timer sits in the centre so it is always one tap away. */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="sessions" />
      <Tabs.Screen name="timer" />
      <Tabs.Screen name="train" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
