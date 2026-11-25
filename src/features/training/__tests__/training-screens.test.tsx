import { Slot } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import TrainLayout from '@/app/(tabs)/train/_layout';
import TrainScreen from '@/app/(tabs)/train/index';
import AlgorithmSetScreen from '@/app/(tabs)/train/[setId]';
import CaseDetailScreen from '@/app/(tabs)/train/case/[caseId]';
import CustomAlgorithmsScreen from '@/app/(tabs)/train/custom';
import FlashcardsScreen from '@/app/(tabs)/train/flashcards';
import { ToastHost } from '@/components/ui';
import { getDatabase } from '@/database/client';
import {
  customCaseKey,
  getProgress,
  listCustomAlgorithms,
  listProgress,
} from '@/database/repositories/training-repository';
import { training } from '@/features/training/actions';
import { useUiStore } from '@/store/ui-store';
import { ThemeProvider } from '@/theme';

function renderTrain(initialUrl = '/train') {
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
    },
    { initialUrl },
  );
}

const progress = (key: string) => getProgress(getDatabase(), key);

describe('train hub and algorithm lists', () => {
  it('lists CFOP sets with progress and honest labels for later work', async () => {
    training.setStatus('pll.t', 'learned');
    await renderTrain();
    expect(screen.getByText('1/21 learned')).toBeOnTheScreen();
    expect(screen.getByText('0/57 learned')).toBeOnTheScreen();
    expect(screen.getByText('0/41 learned')).toBeOnTheScreen();
    expect(screen.getAllByText('Later').length).toBeGreaterThan(0);
  });

  it('opens a set, searches it and filters by status', async () => {
    training.setFavorite('pll.ua', true);
    await renderTrain();
    await fireEvent.press(screen.getByRole('button', { name: /^PLL/ }));
    expect(screen).toHavePathname('/train/pll');
    expect(screen.getByRole('button', { name: 'T' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Ua, favourite' })).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Search'), 'g perm');
    expect(screen.queryByRole('button', { name: 'T' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Ga' })).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Search'), '');
    await fireEvent.press(screen.getByRole('button', { name: 'Favourites' }));
    expect(screen.getByRole('button', { name: 'Ua, favourite' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'T' })).toBeNull();
  });
});

describe('algorithm detail', () => {
  it('changes status, favourite, chosen algorithm and records an execution', async () => {
    await renderTrain('/train/case/pll.ua');
    expect(screen.getByText('Ua')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Learning' }));
    expect(progress('pll.ua').status).toBe('learning');

    await fireEvent.press(screen.getByRole('button', { name: 'Add to favourites' }));
    expect(progress('pll.ua').isFavorite).toBe(true);

    await fireEvent.press(screen.getByRole('radio', { name: /^Alternative:/ }));
    expect(progress('pll.ua').preferredAlgorithm).toBe("R U' R U R U R U' R' U' R2");
    expect(screen.getByRole('radio', { name: /^Alternative:/ })).toBeChecked();

    const spy = jest.spyOn(performance, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2500);
    await fireEvent.press(screen.getByRole('button', { name: 'Start execution timer' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Stop execution timer' }));
    spy.mockRestore();
    expect(progress('pll.ua')).toMatchObject({ executions: 1, bestExecutionMs: 1500 });
  });

  it('adds an alternative algorithm that can be chosen', async () => {
    await renderTrain('/train/case/pll.t');
    await fireEvent.press(screen.getByRole('button', { name: 'Add your own algorithm' }));
    await fireEvent.changeText(screen.getByLabelText('Moves'), 'not moves');
    await fireEvent.press(screen.getByRole('button', { name: 'Save algorithm' }));
    expect(screen.getByText(/Use standard notation/)).toBeOnTheScreen();

    await fireEvent.changeText(
      screen.getByLabelText('Moves'),
      "R U R' U' R' F R2 U' R' U' R U R' F'",
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Save algorithm' }));
    const [alt] = listCustomAlgorithms(getDatabase());
    expect(alt).toMatchObject({ caseId: 'pll.t', set: 'pll', name: 'My T' });
    expect(screen.getByRole('radio', { name: /^My T:/ })).toBeOnTheScreen();
  });
});

describe('flashcards', () => {
  it('shows a case, reveals the answer and schedules the next review', async () => {
    await renderTrain('/train/flashcards?set=pll');
    await fireEvent.press(screen.getByRole('button', { name: 'Start · 20 cards' }));
    expect(screen.getByText('Card 1 of 20')).toBeOnTheScreen();
    expect(screen.getByText('Which case is this, and how do you solve it?')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Show answer' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Good, next review in 1d' }));
    expect(screen.getByText('Card 2 of 20')).toBeOnTheScreen();

    // Missing a card puts it back at the end of the round.
    await fireEvent.press(screen.getByRole('button', { name: 'Show answer' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Again, next review in 10m' }));
    expect(screen.getByText('Card 3 of 21')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'End round' }));
    expect(screen.getByText('Round complete')).toBeOnTheScreen();
    expect(screen.getByText('2 reviews · 50% recalled')).toBeOnTheScreen();

    const reviewed = [...listProgress(getDatabase()).values()].filter((p) => p.reviews > 0);
    expect(reviewed.map((p) => p.intervalDays).sort()).toEqual([0, 1]);
    expect(reviewed.every((p) => p.status === 'learning')).toBe(true);
  });

  it('says when nothing is due, and offers custom algorithms once there are some', async () => {
    await renderTrain('/train/flashcards?set=custom');
    expect(screen.getByText('No algorithms yet')).toBeOnTheScreen();
  });
});

describe('my algorithms', () => {
  it('creates, groups, edits and deletes an algorithm with undo', async () => {
    await renderTrain('/train/custom');
    expect(screen.getByText('No algorithms yet')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'New algorithm' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save algorithm' }));
    expect(screen.getByText('Give it a name')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Name'), 'Sune COLL');
    await fireEvent.changeText(screen.getByLabelText('Moves'), 'R U R’ U R U2 R’');
    await fireEvent.changeText(screen.getByLabelText('Collection (optional)'), 'COLL');
    await fireEvent.press(screen.getByRole('button', { name: 'Save algorithm' }));

    const [created] = listCustomAlgorithms(getDatabase());
    expect(created).toMatchObject({
      name: 'Sune COLL',
      algorithm: "R U R' U R U2 R'",
      collection: 'COLL',
    });
    expect(screen.getByText('COLL')).toBeOnTheScreen();

    // Practise it as a flashcard: its progress is kept under its own key.
    await act(async () => training.review(customCaseKey(created!.id), 'good'));
    expect(progress(customCaseKey(created!.id)).reviews).toBe(1);

    await fireEvent.press(screen.getByRole('button', { name: /^Sune COLL/ }));
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Sune');
    await fireEvent.press(screen.getByRole('button', { name: 'Save algorithm' }));
    expect(listCustomAlgorithms(getDatabase())[0]?.name).toBe('Sune');

    await fireEvent.press(screen.getByRole('button', { name: /^Sune/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Delete algorithm' }));
    expect(listCustomAlgorithms(getDatabase())).toHaveLength(0);
    expect(screen.getByText('No algorithms yet')).toBeOnTheScreen();

    await act(async () => useUiStore.getState().toast?.onAction?.());
    expect(listCustomAlgorithms(getDatabase())).toHaveLength(1);
  });
});
