import { Slot } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import TrainLayout from '@/app/(tabs)/train/_layout';
import AlgorithmSetScreen from '@/app/(tabs)/train/[setId]';
import CaseDetailScreen from '@/app/(tabs)/train/case/[caseId]';
import CustomAlgorithmsScreen from '@/app/(tabs)/train/custom';
import FlashcardsScreen from '@/app/(tabs)/train/flashcards';
import TrainScreen from '@/app/(tabs)/train/index';
import LessonScreen from '@/app/(tabs)/train/learn/[lessonId]';
import LearnScreen from '@/app/(tabs)/train/learn/index';
import NotationGuideScreen from '@/app/(tabs)/train/notation';
import { ToastHost } from '@/components/ui';
import { ThemeProvider } from '@/theme';

/** Renders the real Train stack inside the tab layout, starting at `initialUrl`. */
export function renderTrain(initialUrl = '/train') {
  return renderRouter(
    {
      _layout: () => (
        <ThemeProvider>
          <Slot />
          <ToastHost />
        </ThemeProvider>
      ),
      '(tabs)/_layout': TabsLayout,
      // The other tabs are not under test.
      '(tabs)/index': () => null,
      '(tabs)/sessions': () => null,
      '(tabs)/timer': () => null,
      '(tabs)/profile': () => null,
      '(tabs)/train/_layout': TrainLayout,
      '(tabs)/train/index': TrainScreen,
      '(tabs)/train/[setId]': AlgorithmSetScreen,
      '(tabs)/train/case/[caseId]': CaseDetailScreen,
      '(tabs)/train/flashcards': FlashcardsScreen,
      '(tabs)/train/custom': CustomAlgorithmsScreen,
      '(tabs)/train/learn/index': LearnScreen,
      '(tabs)/train/learn/[lessonId]': LessonScreen,
      '(tabs)/train/notation': NotationGuideScreen,
    },
    { initialUrl },
  );
}
