import { render, screen } from '@testing-library/react';

import { UpNextCard } from './index';

describe('UpNextCard', () => {
  it('renders a labelled region with title, time and sub-items', () => {
    render(
      <UpNextCard
        occurrence={{
          key: 't:2026-09-22',
          taskId: 't',
          date: '2026-09-22',
          title: 'Read book',
          time: '15:00',
          subItems: [{ id: 's', text: 'Chapter 4' }],
          repeatKind: 'none',
          done: false,
          doneSubItemIds: [],
          isOverdue: false,
          createdAt: '2026-09-01T00:00:00.000Z',
        }}
      />,
    );

    const region = screen.getByRole('region', { name: 'Up next' });
    expect(region).toHaveTextContent('Read book');
    expect(region).toHaveTextContent('3 PM');
    expect(region).toHaveTextContent('Chapter 4');
  });
});
