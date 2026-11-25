import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { DEFAULT_TIMER_SETTINGS, useSettingsStore } from '@/store/settings-store';
import { useSolvesStore } from '@/store/solves-store';
import { useUiStore } from '@/store/ui-store';
import { ThemeProvider } from '@/theme';

import { TimerScreen } from '../TimerScreen';

jest.mock('expo-router', () => ({
  // Run focus effects like a normal effect: the screen is focused while mounted.
  useFocusEffect: (effect: () => void | (() => void)) =>
    jest.requireActual('react').useEffect(effect, [effect]),
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

const touchArea = () => screen.getByTestId('timer-touch-area');
const timerText = () => screen.getByRole('timer');

describe('TimerScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useSettingsStore.setState({ timer: { ...DEFAULT_TIMER_SETTINGS, holdMs: 300 } });
    useSolvesStore.setState({ solves: [] });
    useUiStore.setState({ timerFocusMode: false });
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
    const solves = useSolvesStore.getState().solves;
    expect(solves).toHaveLength(1);
    expect(solves[0]).toMatchObject({ rawMs: 9874, penalty: 'none', scramble, puzzleId: '333' });
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
    expect(useSolvesStore.getState().solves).toHaveLength(0);
  });

  it('lets the last solve be marked +2, DNF, or deleted', async () => {
    await renderThemed(<TimerScreen />);
    await fireEvent(touchArea(), 'touchStart');
    await advance(301);
    await fireEvent(touchArea(), 'touchEnd');
    await advance(5000);
    await fireEvent(touchArea(), 'touchStart');

    await fireEvent.press(screen.getByRole('button', { name: '+2' }));
    expect(useSolvesStore.getState().solves[0]?.penalty).toBe('plus2');
    expect(timerText()).toHaveAccessibleName('Solve time 7.000+');

    await fireEvent.press(screen.getByRole('button', { name: 'DNF' }));
    expect(timerText()).toHaveAccessibleName('Solve time DNF(5.000)');

    await fireEvent.press(screen.getByRole('button', { name: 'Delete solve' }));
    expect(useSolvesStore.getState().solves).toHaveLength(0);
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

    expect(useSolvesStore.getState().solves[0]).toMatchObject({ penalty: 'plus2', rawMs: 10_000 });
  });
});
