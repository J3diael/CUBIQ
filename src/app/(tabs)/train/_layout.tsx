import { Stack } from 'expo-router';

export default function TrainStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[setId]" options={{ headerShown: true, title: 'Algorithms' }} />
      <Stack.Screen name="case/[caseId]" options={{ headerShown: true, title: 'Algorithm' }} />
      <Stack.Screen name="flashcards" options={{ headerShown: true, title: 'Flashcards' }} />
      <Stack.Screen name="custom" options={{ headerShown: true, title: 'My algorithms' }} />
    </Stack>
  );
}
