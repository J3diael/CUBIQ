import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/theme';

import { Button, EmptyState, SegmentedControl, StatTile } from '..';
import { Inbox } from 'lucide-react-native';

const renderThemed = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('Button', () => {
  it('calls onPress', async () => {
    const onPress = jest.fn();
    await renderThemed(<Button label="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await renderThemed(<Button label="Save" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('SegmentedControl', () => {
  it('reports the chosen option and marks the current one as checked', async () => {
    const onChange = jest.fn();
    await renderThemed(
      <SegmentedControl
        accessibilityLabel="Theme"
        options={[
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
        ]}
        value="dark"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Light' }));
    expect(onChange).toHaveBeenCalledWith('light');
  });
});

describe('StatTile', () => {
  it('announces missing data in words', async () => {
    await renderThemed(<StatTile label="Best Ao5" value="—" />);
    expect(screen.getByLabelText('Best Ao5: no data yet')).toBeOnTheScreen();
  });
});

describe('EmptyState', () => {
  it('shows its action only when a handler is given', async () => {
    const onAction = jest.fn();
    const { rerender } = await renderThemed(
      <EmptyState icon={Inbox} title="Empty" message="Nothing yet" actionLabel="Start" />,
    );
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
    await rerender(
      <ThemeProvider>
        <EmptyState
          icon={Inbox}
          title="Empty"
          message="Nothing yet"
          actionLabel="Start"
          onAction={onAction}
        />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Start' }));
    expect(onAction).toHaveBeenCalled();
  });
});
