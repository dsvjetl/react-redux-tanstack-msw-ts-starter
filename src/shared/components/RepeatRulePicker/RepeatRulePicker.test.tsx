import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RepeatRulePicker } from './index';

describe('RepeatRulePicker', () => {
  it('offers the four kinds and reports a change', async () => {
    const onKindChange = vi.fn();
    render(
      <RepeatRulePicker
        kind="none"
        weeklyDays={[]}
        onKindChange={onKindChange}
        onWeeklyDaysChange={vi.fn()}
      />,
    );

    const group = screen.getByRole('radiogroup', { name: 'Repeat' });
    expect(group).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Does not repeat' }),
    ).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Every day' }));
    expect(onKindChange).toHaveBeenCalledWith('daily');
    expect(
      screen.queryByRole('group', { name: 'Repeat on' }),
    ).not.toBeInTheDocument();
  });

  it('shows weekday checkboxes for weekly and reports toggles', async () => {
    const onWeeklyDaysChange = vi.fn();
    render(
      <RepeatRulePicker
        kind="weekly"
        weeklyDays={[1]}
        onKindChange={vi.fn()}
        onWeeklyDaysChange={onWeeklyDaysChange}
        error="Pick at least one day"
      />,
    );

    const group = screen.getByRole('group', { name: 'Repeat on' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Mon' })).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Thu' }));
    expect(onWeeklyDaysChange).toHaveBeenCalledWith([1, 4]);
    expect(screen.getByText('Pick at least one day')).toBeInTheDocument();
  });
});
