import { act, render, screen } from '@testing-library/react';

import { useNow } from './useNow';

const Clock = () => {
  const now = useNow(30_000);
  return <span>{now.toISOString()}</span>;
};

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-22T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks on the interval', () => {
    render(<Clock />);
    expect(screen.getByText('2026-09-22T12:00:00.000Z')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByText('2026-09-22T12:00:30.000Z')).toBeInTheDocument();
  });

  it('refreshes when the document becomes visible', () => {
    render(<Clock />);
    act(() => {
      vi.setSystemTime(new Date('2026-09-23T00:00:05.000Z'));
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(screen.getByText('2026-09-23T00:00:05.000Z')).toBeInTheDocument();
  });
});
