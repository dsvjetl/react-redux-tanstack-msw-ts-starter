import { render, screen } from '@testing-library/react';

import { LoadingState } from './index';

describe('LoadingState', () => {
  it('announces the loading message', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading your tasks');
  });
});
