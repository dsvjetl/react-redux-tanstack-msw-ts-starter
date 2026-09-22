import { screen } from '@testing-library/react';

import { BottomNav } from './index';
import { renderWithProviders } from '../../utils/testing/renderWithProviders';

describe('BottomNav', () => {
  it('marks the active view with aria-current', () => {
    renderWithProviders(<BottomNav />, { route: '/calendar' });

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Today' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});
