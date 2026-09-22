import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EmptyState } from './index';

describe('EmptyState', () => {
  it('renders a labelled region with an optional action', async () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No tasks for today"
        actionLabel="Add your first task"
        onAction={onAction}
      />,
    );

    expect(
      screen.getByRole('region', { name: 'No tasks for today' }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Add your first task' }),
    );
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('omits the button without an action', () => {
    render(<EmptyState title="Nothing here" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
