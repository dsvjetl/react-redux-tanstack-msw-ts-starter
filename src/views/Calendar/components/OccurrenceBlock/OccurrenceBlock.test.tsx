import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OccurrenceBlock } from './index';
import type { Occurrence } from '../../../../shared/models/Occurrence';

const base: Occurrence = {
  key: 'p:2026-09-24',
  taskId: 'p',
  date: '2026-09-24',
  title: 'Paper review',
  time: '09:00',
  subItems: [
    { id: '1', text: 'a' },
    { id: '2', text: 'b' },
    { id: '3', text: 'c' },
  ],
  repeatKind: 'none',
  done: false,
  doneSubItemIds: [],
  isOverdue: false,
  createdAt: '2026-09-01T00:00:00.000Z',
};

describe('OccurrenceBlock', () => {
  it('names the block with title, time and sub-item count and opens on click', async () => {
    const onOpen = vi.fn();
    render(<OccurrenceBlock occurrence={base} onOpen={onOpen} />);

    const button = screen.getByRole('button', {
      name: 'Paper review, 9 AM, 3 sub-items',
    });
    expect(button).toHaveTextContent('3');
    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledWith(base);
  });

  it('uses Anytime for untimed tasks and omits the count when empty', () => {
    render(
      <OccurrenceBlock
        occurrence={{ ...base, time: null, subItems: [] }}
        onOpen={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Paper review, Anytime' }),
    ).toBeInTheDocument();
  });

  it('announces the repeat rule in the name', () => {
    render(
      <OccurrenceBlock
        occurrence={{ ...base, repeatKind: 'weekly' }}
        onOpen={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', {
        name: 'Paper review, 9 AM, 3 sub-items, repeats weekly',
      }),
    ).toBeInTheDocument();
  });
});
