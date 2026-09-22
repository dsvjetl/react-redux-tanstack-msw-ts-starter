import { screen } from '@testing-library/react';

import { FloatingAddButton } from './index';
import { renderWithProviders } from '../../utils/testing/renderWithProviders';

describe('FloatingAddButton', () => {
  it('opens the editor in create mode for the given date', async () => {
    const { user, store } = renderWithProviders(
      <FloatingAddButton date="2026-09-25" />,
    );

    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(store.getState().taskEditor).toEqual({
      mode: 'create',
      date: '2026-09-25',
    });
  });
});
