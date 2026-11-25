import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import TabsLayout from '../(tabs)/_layout';
import HomeScreen from '../(tabs)/index';
import ProfileLayout from '../(tabs)/profile/_layout';
import ProfileScreen from '../(tabs)/profile/index';
import SettingsScreen from '../(tabs)/profile/settings';
import SessionsLayout from '../(tabs)/sessions/_layout';
import SessionsScreen from '../(tabs)/sessions/index';
import TimerScreen from '../(tabs)/timer';
import TrainLayout from '../(tabs)/train/_layout';
import TrainScreen from '../(tabs)/train/index';
import SessionDetailScreen from '../(tabs)/sessions/[sessionId]/index';
import SessionStatsScreen from '../(tabs)/sessions/[sessionId]/stats';
import SolveDetailScreen from '../solve/[solveId]';
import { ToastHost } from '@/components/ui';
import { getDatabase } from '@/database/client';
import { getSetting } from '@/database/repositories/settings-repository';
import { listSessions } from '@/database/repositories/sessions-repository';
import { getSolve, listSolves } from '@/database/repositories/solves-repository';
import { useDataStore } from '@/store/data-store';
import { useSettingsStore } from '@/store/settings-store';
import { ThemeProvider } from '@/theme';
import { z } from 'zod';

function renderApp(initialUrl = '/') {
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
      '(tabs)/profile/_layout': ProfileLayout,
      '(tabs)/profile/index': ProfileScreen,
      '(tabs)/profile/settings': SettingsScreen,
    },
    { initialUrl },
  );
}

describe('navigation', () => {
  it('shows the five tabs with Timer in the centre', async () => {
    await renderApp();
    const tabs = screen.getAllByRole('tab').map((tab) => tab.props.accessibilityLabel);
    expect(tabs).toEqual(['Home', 'Sessions', 'Timer', 'Train', 'Profile']);
  });

  it('opens Home first and marks it selected', async () => {
    await renderApp();
    expect(screen).toHavePathname('/');
    expect(screen.getByRole('tab', { name: 'Home' })).toBeSelected();
    expect(screen.getByText('No solves yet')).toBeOnTheScreen();
  });

  it('switches tabs when a tab is pressed', async () => {
    await renderApp();
    await fireEvent.press(screen.getByRole('tab', { name: 'Sessions' }));
    expect(screen).toHavePathname('/sessions');
    expect(screen.getByText('3x3 Practice')).toBeOnTheScreen();
  });

  it('quick start opens the timer', async () => {
    await renderApp();
    await fireEvent.press(screen.getByRole('button', { name: 'Quick start timer' }));
    expect(screen).toHavePathname('/timer');
    expect(screen.getByRole('tab', { name: 'Timer' })).toBeSelected();
  });

  it('reaches settings from profile and changes the theme', async () => {
    await renderApp('/profile');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Settings' })[0]!);
    expect(screen).toHavePathname('/profile/settings');
    await fireEvent.press(screen.getByRole('radio', { name: 'Light' }));
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();

    // Saved to SQLite and loaded again on the next launch.
    expect(getSetting(getDatabase(), 'appearance.theme', z.string(), '')).toBe('light');
    useSettingsStore.setState({ themePreference: 'dark' });
    useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().themePreference).toBe('light');
  });
});

/** Adds a solve to the active session, as the timer would. */
function addSolve(
  rawTimeMs: number,
  extra: Partial<Parameters<ReturnType<typeof useDataStore.getState>['addSolve']>[0]> = {},
) {
  return useDataStore.getState().addSolve({
    puzzleId: '333',
    scramble: "R U R' U'",
    rawTimeMs,
    solvedAt: Date.now(),
    ...extra,
  });
}

describe('sessions', () => {
  it('starts with a default session that is active', async () => {
    await renderApp('/sessions');
    expect(screen.getByText('3x3 Practice')).toBeOnTheScreen();
    expect(screen.getByText('Active')).toBeOnTheScreen();
  });

  it('creates a session with a method and makes it active', async () => {
    await renderApp('/sessions');
    await fireEvent.press(screen.getByRole('button', { name: 'New session' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Create session' }));
    expect(screen.getByText('Give the session a name')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Name'), '  Roux practice ');
    await fireEvent.press(screen.getByRole('button', { name: 'Roux' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Create session' }));

    const created = listSessions(getDatabase()).find((s) => s.name === 'Roux practice');
    expect(created).toMatchObject({ method: 'roux', puzzleId: '333' });
    expect(useDataStore.getState().activeSessionId).toBe(created?.id);
    expect(screen.getByText('0 solves · Roux')).toBeOnTheScreen();
  });

  it('shows a session with its solves and simple numbers, then renames it', async () => {
    const now = Date.now();
    addSolve(10_000, { solvedAt: now - 3000 });
    addSolve(12_000, { solvedAt: now - 2000 });
    addSolve(8_000, { penalty: 'dnf', solvedAt: now - 1000 });
    const id = useDataStore.getState().activeSessionId;
    await renderApp(`/sessions/${id}`);

    expect(screen.getByLabelText('Solves: 3')).toBeOnTheScreen();
    expect(screen.getByLabelText('Best: 10.000')).toBeOnTheScreen();
    expect(screen.getByLabelText('Ao5: no data yet')).toBeOnTheScreen();
    expect(screen.getByText('#3 · DNF(8.000)')).toBeOnTheScreen();
    // Deleting the only session isn't allowed.
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();

    await fireEvent.press(screen.getByRole('button', { name: 'Rename' }));
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Main');
    await fireEvent.press(screen.getByRole('button', { name: 'Save name' }));
    expect(screen.getAllByText('Main').length).toBeGreaterThan(0);
  });

  it('deletes a session with its solves and switches to another', async () => {
    const first = useDataStore.getState().activeSessionId;
    addSolve(10_000);
    const second = useDataStore.getState().createSession({ name: 'Second', puzzleId: '333' });
    await renderApp(`/sessions/${first}`);

    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('“3x3 Practice” and its 1 solve will be removed.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete session' }));

    expect(listSessions(getDatabase()).map((s) => s.id)).toEqual([second.id]);
    expect(listSolves(getDatabase(), first)).toHaveLength(0);
    expect(useDataStore.getState().activeSessionId).toBe(second.id);
  });
});

describe('statistics', () => {
  it('shows averages, consistency and charts for a session', async () => {
    const now = Date.now();
    [12, 10, 14, 9, 11, 20, 8].forEach((sec, i) =>
      addSolve(sec * 1000, { solvedAt: now - 10_000 + i * 1000 }),
    );
    addSolve(7_000, { penalty: 'dnf', solvedAt: now });
    const id = useDataStore.getState().activeSessionId;
    await renderApp(`/sessions/${id}`);
    await fireEvent.press(screen.getByRole('button', { name: 'Statistics and charts' }));
    expect(screen).toHavePathname(`/sessions/${id}/stats`);

    expect(screen.getByLabelText('Solves: 8')).toBeOnTheScreen();
    expect(screen.getByLabelText('Best: 8.000')).toBeOnTheScreen();
    // Last five: 9, 11, 20, 8, DNF → drop 8 and DNF → mean(9, 11, 20) = 13.333
    expect(screen.getByLabelText('Ao5: current 13.333, best 11.000')).toBeOnTheScreen();
    expect(screen.getByLabelText('Ao12: current —, best —')).toBeOnTheScreen();
    expect(screen.getByLabelText('DNF rate: 13%')).toBeOnTheScreen();
    expect(screen.getByTestId('trend-chart')).toHaveAccessibleName(
      'Trend of 8 solves. Current Ao5 13.333, current Ao12 —.',
    );
    expect(screen.getByTestId('distribution-chart')).toBeOnTheScreen();
  });

  it('asks for more solves before drawing charts', async () => {
    addSolve(10_000);
    await renderApp(`/sessions/${useDataStore.getState().activeSessionId}/stats`);
    expect(screen.getByText('Charts need a few solves')).toBeOnTheScreen();
    expect(screen.queryByTestId('trend-chart')).toBeNull();
  });

  it('shows personal-best averages on Home', async () => {
    [10, 11, 12, 13, 14].forEach((sec, i) => addSolve(sec * 1000, { solvedAt: Date.now() + i }));
    await renderApp('/');
    expect(screen.getByLabelText('Ao5: 12.000')).toBeOnTheScreen();
    expect(screen.getByLabelText('Ao12: no data yet')).toBeOnTheScreen();
  });
});

describe('home and solve detail', () => {
  it('shows real totals, best single and recent solves', async () => {
    addSolve(9_870);
    addSolve(11_000, { penalty: 'plus2' });
    await renderApp('/');
    expect(screen.getByLabelText('Single: 9.870')).toBeOnTheScreen();
    expect(screen.getByLabelText('Total: 2')).toBeOnTheScreen();
    expect(screen.getByLabelText('Today: 2')).toBeOnTheScreen();
    expect(screen.getByText('13.000+')).toBeOnTheScreen();
    expect(screen.queryByText('No solves yet')).toBeNull();
  });

  it('opens a solve to change its penalty, add a note, and delete it with undo', async () => {
    const solve = addSolve(9_870);
    await renderApp('/');
    // The time shows in the Single tile and in the recent list; press the list row.
    await fireEvent.press(screen.getAllByText('9.870').at(-1)!);
    expect(screen).toHavePathname(`/solve/${solve.id}`);
    expect(screen.getByText("R U R' U'")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: '+2' }));
    expect(getSolve(getDatabase(), solve.id)?.penalty).toBe('plus2');
    expect(screen.getByLabelText('Solve time 11.870+')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Notes'), 'PLL skip');
    await fireEvent(screen.getByLabelText('Notes'), 'blur');
    expect(getSolve(getDatabase(), solve.id)?.notes).toBe('PLL skip');

    await fireEvent.press(screen.getByRole('button', { name: 'Delete solve' }));
    expect(getSolve(getDatabase(), solve.id)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
    expect(getSolve(getDatabase(), solve.id)).toMatchObject({
      notes: 'PLL skip',
      penalty: 'plus2',
    });
  });
});
