import { Stack } from 'expo-router';

export default function TabStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[sessionId]/index" options={{ headerShown: true, title: 'Session' }} />
      <Stack.Screen name="[sessionId]/stats" options={{ headerShown: true, title: 'Statistics' }} />
    </Stack>
  );
}
