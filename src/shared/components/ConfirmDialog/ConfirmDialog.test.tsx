import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmDialog } from './index';

describe('ConfirmDialog', () => {
  it('renders an alert dialog and reports confirm and cancel', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete this task?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(
      screen.getByRole('alertdialog', { name: 'Delete this task?' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
