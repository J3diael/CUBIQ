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
import { ThemeProvider } from '@/theme';

function renderApp(initialUrl = '/') {
  return renderRouter(
    {
      // Wrap the real tab layout in the theme, as the root layout does in the app.
      _layout: () => (
        <ThemeProvider>
          <Slot />
        </ThemeProvider>
      ),
      '(tabs)/_layout': TabsLayout,
      '(tabs)/index': HomeScreen,
      '(tabs)/timer': TimerScreen,
      '(tabs)/sessions/_layout': SessionsLayout,
      '(tabs)/sessions/index': SessionsScreen,
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
    expect(screen.getByText('No sessions yet')).toBeOnTheScreen();
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
  });
});
