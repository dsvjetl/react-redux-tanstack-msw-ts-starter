import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WeekHeader } from './index';

describe('WeekHeader', () => {
  it('shows the range and wires the controls', async () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onThisWeek = vi.fn();
    render(
      <WeekHeader
        rangeLabel="22 – 28 Sep"
        isCurrentWeek={false}
        onPrevious={onPrevious}
        onNext={onNext}
        onThisWeek={onThisWeek}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Schedule' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('22 – 28 Sep');
    await userEvent.click(
      screen.getByRole('button', { name: 'Previous week' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next week' }));
    await userEvent.click(screen.getByRole('button', { name: 'This week' }));
    expect(onPrevious).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
    expect(onThisWeek).toHaveBeenCalled();
  });

  it('disables This week when already there', () => {
    render(
      <WeekHeader
        rangeLabel="x"
        isCurrentWeek
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onThisWeek={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'This week' })).toBeDisabled();
  });
});
