import { render, screen, within } from '@testing-library/react';

import { AnytimeRow } from './index';

describe('AnytimeRow', () => {
  it('renders an Anytime row header and blocks in their day cells', () => {
    const days = ['2026-09-22', '2026-09-23'];
    render(
      <div role="table">
        <AnytimeRow
          days={days}
          byDay={{
            '2026-09-22': { anytime: [] },
            '2026-09-23': {
              anytime: [
                {
                  key: 'a:2026-09-23',
                  taskId: 'a',
                  date: '2026-09-23',
                  title: 'Family lunch',
                  time: null,
                  subItems: [],
                  repeatKind: 'none',
                  done: false,
                  doneSubItemIds: [],
                  isOverdue: false,
                  createdAt: '2026-09-01T00:00:00.000Z',
                },
              ],
            },
          }}
          isToday={(d) => d === '2026-09-22'}
          onOpen={vi.fn()}
        />
      </div>,
    );

    const row = screen.getByRole('row');
    expect(within(row).getByRole('rowheader')).toHaveTextContent('Anytime');
    const cells = within(row).getAllByRole('cell');
    expect(
      within(cells[1]).getByRole('button', { name: 'Family lunch, Anytime' }),
    ).toBeInTheDocument();
  });
});
