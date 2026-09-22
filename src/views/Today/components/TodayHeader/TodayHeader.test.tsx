import { render, screen } from '@testing-library/react';

import { TodayHeader } from './index';

describe('TodayHeader', () => {
  it('shows the formatted date and a live remaining count', () => {
    render(<TodayHeader today="2026-09-22" remainingCount={4} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tuesday, Sep 22' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: '4 tasks remaining' }),
    ).toHaveTextContent('4');
  });

  it('uses the singular for one task', () => {
    render(<TodayHeader today="2026-09-22" remainingCount={1} />);
    expect(
      screen.getByRole('status', { name: '1 task remaining' }),
    ).toBeInTheDocument();
  });
});
