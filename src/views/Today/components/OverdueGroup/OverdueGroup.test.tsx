import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OverdueGroup } from './index';
import type { Occurrence } from '../../../../shared/models/Occurrence';

const overdue: Occurrence = {
  key: 'old:2026-09-21',
  taskId: 'old',
  date: '2026-09-21',
  title: 'Return library books',
  time: '10:00',
  subItems: [],
  repeatKind: 'none',
  done: false,
  doneSubItemIds: [],
  isOverdue: true,
  createdAt: '2026-09-01T00:00:00.000Z',
};

describe('OverdueGroup', () => {
  it('labels cards with their original date and offers Move to today', async () => {
    const onMoveToToday = vi.fn();
    render(
      <OverdueGroup
        occurrences={[overdue]}
        onToggleDone={vi.fn()}
        onToggleSubItem={vi.fn()}
        onMoveToToday={onMoveToToday}
      />,
    );

    const region = screen.getByRole('region', { name: 'Overdue' });
    const card = within(region).getByRole('article', {
      name: 'Return library books',
    });
    expect(card).toHaveTextContent('Monday, Sep 21');
    await userEvent.click(
      within(card).getByRole('button', { name: 'Move to today' }),
    );
    expect(onMoveToToday).toHaveBeenCalledWith(overdue);
  });

  it('renders nothing when empty', () => {
    const { container } = render(
      <OverdueGroup
        occurrences={[]}
        onToggleDone={vi.fn()}
        onToggleSubItem={vi.fn()}
        onMoveToToday={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
