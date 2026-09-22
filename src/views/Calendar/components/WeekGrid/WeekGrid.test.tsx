import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WeekGrid } from './index';
import type { Occurrence } from '../../../../shared/models/Occurrence';
import { weekDays } from '../../../../shared/utils/date';
import type { DayOccurrences } from '../../hooks/useWeekOccurrences';

const occurrence = (
  id: string,
  date: string,
  time: string | null,
): Occurrence => ({
  key: `${id}:${date}`,
  taskId: id,
  date,
  title: id,
  time,
  subItems: [],
  repeatKind: 'none',
  done: false,
  doneSubItemIds: [],
  isOverdue: false,
  createdAt: '2026-09-01T00:00:00.000Z',
});

describe('WeekGrid', () => {
  it('renders 7 day headers, hour rows, and places blocks by hour', async () => {
    const days = weekDays('2026-09-22');
    const byDay: Record<string, DayOccurrences> = Object.fromEntries(
      days.map((d) => [d, { anytime: [], timed: [] }]),
    );
    byDay['2026-09-24'].timed.push(
      occurrence('Paper review', '2026-09-24', '09:00'),
    );
    byDay['2026-09-24'].timed.push(occurrence('Late', '2026-09-24', '23:30'));
    byDay['2026-09-22'].anytime.push(occurrence('Any', '2026-09-22', null));
    const onAddOn = vi.fn();

    render(
      <WeekGrid
        days={days}
        byDay={byDay}
        isToday={(d) => d === '2026-09-22'}
        onOpen={vi.fn()}
        onAddOn={onAddOn}
      />,
    );

    const table = screen.getByRole('table', { name: 'Week schedule' });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers).toHaveLength(8);
    expect(headers[1]).toHaveTextContent('Tue 22');
    expect(headers[1]).toHaveAttribute('aria-current', 'date');
    expect(headers[2]).not.toHaveAttribute('aria-current');

    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(1 + 1 + 18);
    const nineAm = rows.find(
      (row) => within(row).queryByRole('rowheader')?.textContent === '9 AM',
    );
    expect(nineAm).toBeDefined();
    const cells = within(nineAm!).getAllByRole('cell');
    expect(
      within(cells[2]).getByRole('button', { name: 'Paper review, 9 AM' }),
    ).toBeInTheDocument();

    const elevenPm = rows.find(
      (row) => within(row).queryByRole('rowheader')?.textContent === '11 PM',
    );
    expect(
      within(elevenPm!).getByRole('button', { name: 'Late, 11:30 PM' }),
    ).toBeInTheDocument();

    const anytimeRow = rows[1];
    expect(
      within(anytimeRow).getByRole('button', { name: 'Any, Anytime' }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Add task on Thursday, Sep 24' }),
    );
    expect(onAddOn).toHaveBeenCalledWith('2026-09-24');
  });
});
