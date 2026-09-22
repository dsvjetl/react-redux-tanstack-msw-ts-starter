import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ErrorState } from './index';

describe('ErrorState', () => {
  it('renders an alert with a dismiss button', async () => {
    const onDismiss = vi.fn();
    render(
      <ErrorState
        message="We couldn't load your saved tasks"
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      "We couldn't load your saved tasks",
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
