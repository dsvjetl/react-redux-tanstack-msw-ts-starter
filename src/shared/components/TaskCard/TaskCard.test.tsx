import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TaskCard } from './index';
import type { Occurrence } from '../../models/Occurrence';

const occurrence: Occurrence = {
  key: 't:2026-09-22',
  taskId: 't',
  date: '2026-09-22',
  title: 'Read book',
  time: '15:00',
  subItems: [{ id: 's1', text: 'Chapter 4' }],
  repeatKind: 'none',
  done: false,
  doneSubItemIds: [],
  isOverdue: false,
  createdAt: '2026-09-01T00:00:00.000Z',
};

describe('TaskCard', () => {
  it('exposes the done checkbox and sub-items and opens on title', async () => {
    const onToggleDone = vi.fn();
    const onToggleSubItem = vi.fn();
    const onOpen = vi.fn();
    render(
      <TaskCard
        occurrence={occurrence}
        onToggleDone={onToggleDone}
        onToggleSubItem={onToggleSubItem}
        onOpen={onOpen}
      />,
    );

    expect(
      screen.getByRole('article', { name: 'Read book' }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Mark Read book done' }),
    );
    expect(onToggleDone).toHaveBeenCalledWith(true);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Chapter 4' }));
    expect(onToggleSubItem).toHaveBeenCalledWith('s1', true);
    await userEvent.click(screen.getByRole('button', { name: 'Read book' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('shows a repeat badge for repeating tasks', () => {
    render(
      <TaskCard
        occurrence={{ ...occurrence, repeatKind: 'daily' }}
        onToggleDone={vi.fn()}
        onToggleSubItem={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('img', { name: 'Repeats every day' }),
    ).toBeInTheDocument();
  });
});
