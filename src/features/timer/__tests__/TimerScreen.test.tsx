import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { getDatabase } from '@/database/client';
import { getSetting } from '@/database/repositories/settings-repository';
import { listSolves } from '@/database/repositories/solves-repository';
import { DATA_SETTING_KEYS, useDataStore } from '@/store/data-store';
import { DEFAULT_TIMER_SETTINGS, useSettingsStore } from '@/store/settings-store';
import { useUiStore } from '@/store/ui-store';
import { z } from 'zod';
import { ThemeProvider } from '@/theme';

import { TimerScreen } from '../TimerScreen';

jest.mock('expo-router', () => ({
  // Run focus effects like a normal effect: the screen is focused while mounted.
  useFocusEffect: (effect: () => void | (() => void)) =>
    jest.requireActual('react').useEffect(effect, [effect]),
  router: { navigate: jest.fn(), push: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

const renderThemed = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

/** Solves saved in the active session, read straight from SQLite. */
const savedSolves = () => listSolves(getDatabase(), useDataStore.getState().activeSessionId);

const touchArea = () => screen.getByTestId('timer-touch-area');
const timerText = () => screen.getByRole('timer');

describe('TimerScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useSettingsStore.setState({ timer: { ...DEFAULT_TIMER_SETTINGS, holdMs: 300 } });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a scramble once one is generated', async () => {
    await renderThemed(<TimerScreen />);
    expect(await screen.findByLabelText(/^Scramble: R U R' U'/)).toBeOnTheScreen();
  });

  it('times a solve with hold, release and tap, then records it with its scramble', async () => {
    await renderThemed(<TimerScreen />);
    const scramble = (await screen.findByLabelText(/^Scramble:/)).props.accessibilityLabel.replace(
      'Scramble: ',
      '',
    );

    await fireEvent(touchArea(), 'touchStart');
    expect(screen.getByText('Keep holding…')).toBeOnTheScreen();
    await advance(301);
    expect(screen.getByText('Release to start')).toBeOnTheScreen();
    expect(useUiStore.getState().timerFocusMode).toBe(true);

    await fireEvent(touchArea(), 'touchEnd');
    expect(screen.getByText('Tap anywhere to stop')).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Scramble:/)).toBeNull();

    await advance(9874);
    await fireEvent(touchArea(), 'touchStart');
    await fireEvent(touchArea(), 'touchEnd');

    expect(timerText()).toHaveAccessibleName('Solve time 9.874');
    const solves = savedSolves();
    expect(solves).toHaveLength(1);
    expect(solves[0]).toMatchObject({
      rawTimeMs: 9874,
      penalty: 'none',
      scramble,
      puzzleId: '333',
      source: 'timer',
    });
    expect(useUiStore.getState().timerFocusMode).toBe(false);

    // A fresh scramble replaces the used one.
    const next = await screen.findByLabelText(/^Scramble:/);
    expect(next.props.accessibilityLabel).not.toBe(`Scramble: ${scramble}`);
  });

  it('does not start when released before the hold time', async () => {
    await renderThemed(<TimerScreen />);
    await fireEvent(touchArea(), 'touchStart');
    await advance(200);
    await fireEvent(touchArea(), 'touchEnd');
    expect(screen.getByText('Hold, then release to start')).toBeOnTheScreen();
    expect(savedSolves()).toHaveLength(0);
  });

  it('lets the last solve be marked +2, DNF, or deleted', async () => {
    await renderThemed(<TimerScreen />);
    await fireEvent(touchArea(), 'touchStart');
    await advance(301);
    await fireEvent(touchArea(), 'touchEnd');
    await advance(5000);
    await fireEvent(touchArea(), 'touchStart');

    await fireEvent.press(screen.getByRole('button', { name: '+2' }));
    expect(savedSolves()[0]?.penalty).toBe('plus2');
    expect(timerText()).toHaveAccessibleName('Solve time 7.000+');

    await fireEvent.press(screen.getByRole('button', { name: 'DNF' }));
    expect(timerText()).toHaveAccessibleName('Solve time DNF(5.000)');

    await fireEvent.press(screen.getByRole('button', { name: 'Delete solve' }));
    expect(savedSolves()).toHaveLength(0);

    // Deleting offers Undo, which brings the solve back.
    const toast = useUiStore.getState().toast;
    expect(toast?.message).toBe('Solve deleted');
    await act(async () => toast?.onAction?.());
    expect(savedSolves()).toHaveLength(1);
  });

  it('keeps a record of a running solve until it ends, for crash recovery', async () => {
    await renderThemed(<TimerScreen />);
    await screen.findByLabelText(/^Scramble:/);
    const inProgress = () =>
      getSetting(getDatabase(), DATA_SETTING_KEYS.inProgressSolve, z.unknown(), null);

    await fireEvent(touchArea(), 'touchStart');
    await advance(301);
    await fireEvent(touchArea(), 'touchEnd');
    expect(inProgress()).toMatchObject({
      puzzleId: '333',
      scramble: expect.stringMatching(/^R U/),
    });

    await advance(3000);
    await fireEvent(touchArea(), 'touchStart');
    expect(inProgress()).toBeNull();
  });

  it('saves a typed time with the current scramble', async () => {
    await renderThemed(<TimerScreen />);
    const scramble = (await screen.findByLabelText(/^Scramble:/)).props.accessibilityLabel.replace(
      'Scramble: ',
      '',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Add a time manually' }));
    await fireEvent.changeText(screen.getByLabelText('Time'), '1:02.34');
    expect(screen.getByText('Saves as 1:02.340')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Save time' }));

    expect(savedSolves()).toEqual([
      expect.objectContaining({ rawTimeMs: 62_340, source: 'manual', scramble, penalty: 'none' }),
    ]);
  });

  it('rejects an invalid typed time', async () => {
    await renderThemed(<TimerScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Add a time manually' }));
    await fireEvent.changeText(screen.getByLabelText('Time'), '1:75');
    await fireEvent.press(screen.getByRole('button', { name: 'Save time' }));
    expect(screen.getByText('Seconds must be under 60')).toBeOnTheScreen();
    expect(savedSolves()).toHaveLength(0);
  });

  it('switches the session new solves go into', async () => {
    const second = useDataStore.getState().createSession({ name: 'OH', puzzleId: '333' });
    await renderThemed(<TimerScreen />);
    expect(screen.getByText('3x3 · 3x3 Practice')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /^Session: 3x3 Practice/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^OH/ }));
    expect(useDataStore.getState().activeSessionId).toBe(second.id);
    expect(screen.getByText('3x3 · OH')).toBeOnTheScreen();
  });

  it('runs inspection and applies +2 when the solve starts late', async () => {
    useSettingsStore.setState({ timer: { ...DEFAULT_TIMER_SETTINGS, inspectionEnabled: true } });
    await renderThemed(<TimerScreen />);
    expect(screen.getByText('Tap to start inspection')).toBeOnTheScreen();

    await fireEvent(touchArea(), 'touchStart');
    await fireEvent(touchArea(), 'touchEnd');
    expect(timerText()).toHaveAccessibleName('Inspection, 15');

    await advance(15_500);
    await fireEvent(touchArea(), 'touchStart');
    await advance(301);
    await fireEvent(touchArea(), 'touchEnd');
    await advance(10_000);
    await fireEvent(touchArea(), 'touchStart');

    expect(savedSolves()[0]).toMatchObject({ penalty: 'plus2', rawTimeMs: 10_000 });
  });
});
