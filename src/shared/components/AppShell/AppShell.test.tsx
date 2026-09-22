import { screen, waitFor, within } from '@testing-library/react';

import { AppShell } from './index';
import { InMemoryTaskRepository } from '../../services/taskRepository/InMemoryTaskRepository';
import { renderWithProviders } from '../../utils/testing/renderWithProviders';
import { Today } from '../../../views/Today';

describe('AppShell', () => {
  it('renders children inside main with the primary navigation', () => {
    renderWithProviders(
      <AppShell>
        <h1>Hello</h1>
      </AppShell>,
    );

    expect(screen.getByRole('main')).toHaveTextContent('Hello');
    expect(
      screen.getByRole('navigation', { name: 'Primary' }),
    ).toBeInTheDocument();
  });

  it('supports a keyboard-only add flow and closes dialogs with Escape', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithProviders(
      <AppShell>
        <Today />
      </AppShell>,
      { repository },
    );
    await screen.findByRole('region', { name: 'No tasks for today' });

    // Tab to the floating "Add task" button and open it with Enter.
    const addButton = screen.getByRole('button', { name: 'Add task' });
    let guard = 0;
    while (document.activeElement !== addButton && guard < 20) {
      await user.tab();
      guard += 1;
    }
    expect(addButton).toHaveFocus();
    await user.keyboard('{Enter}');

    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await waitFor(() =>
      expect(
        within(dialog).getByRole('textbox', { name: 'Title' }),
      ).toHaveFocus(),
    );
    await user.keyboard('Stretch');
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByRole('article', { name: 'Stretch' }),
    ).toBeInTheDocument();

    // Open the detail dialog from the keyboard and dismiss it with Escape.
    screen.getByRole('button', { name: 'Stretch' }).focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('dialog', { name: 'Stretch' });
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });
});
