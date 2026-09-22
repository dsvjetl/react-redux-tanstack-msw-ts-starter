import { render, screen, within } from '@testing-library/react';

import { AnytimeGroup } from './index';

describe('AnytimeGroup', () => {
  it('lists untimed occurrences under an Anytime heading', () => {
    render(
      <AnytimeGroup
        occurrences={[
          {
            key: 'a:2026-09-22',
            taskId: 'a',
            date: '2026-09-22',
            title: 'Buy kitten food',
            time: null,
            subItems: [],
            repeatKind: 'none',
            done: false,
            doneSubItemIds: [],
            isOverdue: false,
            createdAt: '2026-09-01T00:00:00.000Z',
          },
        ]}
        onToggleDone={vi.fn()}
        onToggleSubItem={vi.fn()}
      />,
    );

    const list = screen.getByRole('list', { name: 'Anytime' });
    expect(
      within(list).getByRole('article', { name: 'Buy kitten food' }),
    ).toBeInTheDocument();
  });
});
