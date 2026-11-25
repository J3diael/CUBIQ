import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

import { ToastHost } from '@/components/ui';
import { StartupErrorScreen } from '@/features/bootstrap/StartupErrorScreen';
import { useAppBootstrap } from '@/features/bootstrap/use-app-bootstrap';
import { InterruptedSolveSheet } from '@/features/timer/components/InterruptedSolveSheet';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { ScrambleEngineHost } from '@/services/scramble-engine/ScrambleEngineHost';
import { lockPortrait } from '@/services/orientation';
import { ThemeProvider, useTheme } from '@/theme';
import { toNavigationTheme } from '@/theme/navigation-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsReady = useAppFonts();
  const { state: data, retry } = useAppBootstrap();
  const ready = fontsReady && data.status !== 'loading';

  // Portrait everywhere; the Timer tab unlocks rotation when the user allows it.
  useEffect(() => {
    lockPortrait();
  }, []);

  // The splash screen stays up until fonts and saved data are loaded.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          {data.status === 'error' ? (
            <StartupErrorScreen message={data.message} onRetry={retry} />
          ) : (
            <>
              <ThemedNavigation />
              <InterruptedSolveSheet />
              <ToastHost />
            </>
          )}
        </ThemeProvider>
        <ScrambleEngineHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedNavigation() {
  const theme = useTheme();

  useEffect(() => {
    // Root view colour shows behind screens during transitions and keyboard animations.
    SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme.colors.background]);

  return (
    <NavigationThemeProvider value={toNavigationTheme(theme)}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="solve/[solveId]"
          options={{ presentation: 'modal', headerShown: true, title: 'Solve' }}
        />
        <Stack.Screen
          name="dev/gallery"
          options={{ headerShown: true, title: 'Component gallery' }}
        />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Not found' }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
