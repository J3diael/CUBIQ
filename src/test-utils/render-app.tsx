import { Slot } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import HomeScreen from '@/app/(tabs)/index';
import ProfileLayout from '@/app/(tabs)/profile/_layout';
import ProfileScreen from '@/app/(tabs)/profile/index';
import SettingsScreen from '@/app/(tabs)/profile/settings';
import SessionDetailScreen from '@/app/(tabs)/sessions/[sessionId]/index';
import SessionStatsScreen from '@/app/(tabs)/sessions/[sessionId]/stats';
import SessionsLayout from '@/app/(tabs)/sessions/_layout';
import SessionsScreen from '@/app/(tabs)/sessions/index';
import TimerScreen from '@/app/(tabs)/timer';
import AlgorithmSetScreen from '@/app/(tabs)/train/[setId]';
import TrainLayout from '@/app/(tabs)/train/_layout';
import CaseDetailScreen from '@/app/(tabs)/train/case/[caseId]';
import CustomAlgorithmsScreen from '@/app/(tabs)/train/custom';
import FlashcardsScreen from '@/app/(tabs)/train/flashcards';
import TrainScreen from '@/app/(tabs)/train/index';
import LessonScreen from '@/app/(tabs)/train/learn/[lessonId]';
import LearnScreen from '@/app/(tabs)/train/learn/index';
import NotationGuideScreen from '@/app/(tabs)/train/notation';
import SolveDetailScreen from '@/app/solve/[solveId]';
import { ToastHost } from '@/components/ui';
import { ThemeProvider } from '@/theme';

/** Renders the real app routes (without the native-only root extras), at `initialUrl`. */
export function renderApp(initialUrl = '/') {
  return renderRouter(
    {
      // Wrap the real tab layout in the theme, as the root layout does in the app.
      _layout: () => (
        <ThemeProvider>
          <Slot />
          <ToastHost />
        </ThemeProvider>
      ),
      '(tabs)/_layout': TabsLayout,
      '(tabs)/index': HomeScreen,
      '(tabs)/timer': TimerScreen,
      '(tabs)/sessions/_layout': SessionsLayout,
      '(tabs)/sessions/index': SessionsScreen,
      '(tabs)/sessions/[sessionId]/index': SessionDetailScreen,
      '(tabs)/sessions/[sessionId]/stats': SessionStatsScreen,
      'solve/[solveId]': SolveDetailScreen,
      '(tabs)/train/_layout': TrainLayout,
      '(tabs)/train/index': TrainScreen,
      '(tabs)/train/[setId]': AlgorithmSetScreen,
      '(tabs)/train/case/[caseId]': CaseDetailScreen,
      '(tabs)/train/flashcards': FlashcardsScreen,
      '(tabs)/train/custom': CustomAlgorithmsScreen,
      '(tabs)/train/learn/index': LearnScreen,
      '(tabs)/train/learn/[lessonId]': LessonScreen,
      '(tabs)/train/notation': NotationGuideScreen,
      '(tabs)/profile/_layout': ProfileLayout,
      '(tabs)/profile/index': ProfileScreen,
      '(tabs)/profile/settings': SettingsScreen,
    },
    { initialUrl },
  );
}
