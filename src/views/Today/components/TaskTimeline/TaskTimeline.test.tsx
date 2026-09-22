import { render, screen, within } from '@testing-library/react';

import { TaskTimeline } from './index';
import type { Occurrence } from '../../../../shared/models/Occurrence';

const make = (id: string, time: string): Occurrence => ({
  key: `${id}:2026-09-22`,
  taskId: id,
  date: '2026-09-22',
  title: id,
  time,
  subItems: [],
  repeatKind: 'none',
  done: false,
  doneSubItemIds: [],
  isOverdue: false,
  createdAt: '2026-09-01T00:00:00.000Z',
});

describe('TaskTimeline', () => {
  it('lists occurrences in the given order with time labels', () => {
    render(
      <TaskTimeline
        occurrences={[make('First', '08:00'), make('Second', '14:30')]}
        onToggleDone={vi.fn()}
        onToggleSubItem={vi.fn()}
      />,
    );

    const list = screen.getByRole('list', { name: "Today's schedule" });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('8 AM');
    expect(items[1]).toHaveTextContent('2:30 PM');
  });

  it('renders nothing when empty', () => {
    const { container } = render(
      <TaskTimeline
        occurrences={[]}
        onToggleDone={vi.fn()}
        onToggleSubItem={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
