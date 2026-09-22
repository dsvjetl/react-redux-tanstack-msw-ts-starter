import { screen, waitFor, within } from '@testing-library/react';

import { Calendar } from './index';
import { AppShell } from '../../shared/components/AppShell';
import { emptyDocument } from '../../shared/models/PlannerDocument';
import type { Task } from '../../shared/models/Task';
import { InMemoryTaskRepository } from '../../shared/services/taskRepository/InMemoryTaskRepository';
import { renderWithProviders } from '../../shared/utils/testing/renderWithProviders';

const TODAY = '2026-09-22';

const task = (
  overrides: Partial<Task> & { id: string; title: string },
): Task => ({
  startDate: TODAY,
  time: null,
  repeat: { kind: 'none' },
  endDate: null,
  subItems: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const weekFixture = () => ({
  ...emptyDocument(),
  tasks: [
    task({ id: 'read', title: 'Read book', time: '15:00' }),
    task({
      id: 'paper',
      title: 'Paper review',
      startDate: '2026-09-24',
      time: '09:00',
      subItems: [
        { id: 'p1', text: 'a' },
        { id: 'p2', text: 'b' },
        { id: 'p3', text: 'c' },
      ],
    }),
    task({ id: 'lunch', title: 'Family lunch', startDate: '2026-09-26' }),
  ],
});

const renderCalendar = (
  repository = new InMemoryTaskRepository(weekFixture()),
) =>
  renderWithProviders(
    <AppShell>
      <Calendar />
    </AppShell>,
    { repository, route: '/calendar' },
  );

const rowNamed = (table: HTMLElement, name: string) =>
  within(table)
    .getAllByRole('row')
    .find(
      (row) => within(row).queryByRole('rowheader')?.textContent === name,
    ) as HTMLElement;

describe('Calendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 22, 14, 0, 0));
  });

  afterEach(() => vi.useRealTimers());

  it('shows the heading, range chip and a 7-day grid starting today', async () => {
    renderCalendar();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Schedule' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('22 – 28 Sep');
    const table = await screen.findByRole('table', { name: 'Week schedule' });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers).toHaveLength(8);
    expect(headers[1]).toHaveTextContent('Tue 22');
    expect(headers[1]).toHaveAttribute('aria-current', 'date');
    expect(headers[7]).toHaveTextContent('Mon 28');
  });

  it('places blocks in the right day column and hour row with sub-item badges', async () => {
    renderCalendar();
    const table = await screen.findByRole('table', { name: 'Week schedule' });

    const nineAm = rowNamed(table, '9 AM');
    const cells = within(nineAm).getAllByRole('cell');
    expect(
      within(cells[2]).getByRole('button', {
        name: 'Paper review, 9 AM, 3 sub-items',
      }),
    ).toHaveTextContent('3');

    const threePm = rowNamed(table, '3 PM');
    expect(
      within(within(threePm).getAllByRole('cell')[0]).getByRole('button', {
        name: 'Read book, 3 PM',
      }),
    ).toBeInTheDocument();

    const anytime = rowNamed(table, 'Anytime');
    expect(
      within(within(anytime).getAllByRole('cell')[4]).getByRole('button', {
        name: 'Family lunch, Anytime',
      }),
    ).toBeInTheDocument();
  });

  it('navigates weeks and returns to this week', async () => {
    const { user } = renderCalendar();
    await screen.findByRole('table', { name: 'Week schedule' });
    expect(screen.getByRole('button', { name: 'This week' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next week' }));
    expect(screen.getByRole('status')).toHaveTextContent('29 Sep – 5 Oct');
    expect(screen.getByRole('button', { name: 'This week' })).toBeEnabled();
    expect(
      screen.queryByRole('columnheader', { current: 'date' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'This week' }));
    expect(screen.getByRole('status')).toHaveTextContent('22 – 28 Sep');
    expect(
      screen.getByRole('columnheader', { current: 'date' }),
    ).toHaveTextContent('Tue 22');
  });

  it('opens the editor prefilled with a future day', async () => {
    const { user, store } = renderCalendar();
    await screen.findByRole('table', { name: 'Week schedule' });

    await user.click(
      screen.getByRole('button', { name: 'Add task on Thursday, Sep 24' }),
    );

    expect(store.getState().taskEditor).toEqual({
      mode: 'create',
      date: '2026-09-24',
    });
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    expect(within(dialog).getByLabelText('Date')).toHaveValue('2026-09-24');
  });

  it('opens the detail dialog from a block', async () => {
    const { user } = renderCalendar();
    await screen.findByRole('table', { name: 'Week schedule' });

    await user.click(
      screen.getByRole('button', { name: 'Paper review, 9 AM, 3 sub-items' }),
    );

    const dialog = await screen.findByRole('dialog', { name: 'Paper review' });
    expect(
      within(dialog).getByRole('button', { name: 'Mark done' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Edit' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Delete' }),
    ).toBeInTheDocument();
  });

  it('keeps every block reachable when a day is crowded', async () => {
    const doc = emptyDocument();
    doc.tasks = Array.from({ length: 12 }, (_, i) =>
      task({
        id: `t${i}`,
        title: `Task ${i}`,
        startDate: '2026-09-23',
        time: '10:00',
      }),
    );
    renderCalendar(new InMemoryTaskRepository(doc));
    const table = await screen.findByRole('table', { name: 'Week schedule' });
    const tenAm = rowNamed(table, '10 AM');
    expect(
      within(tenAm).getAllByRole('button', { name: /Task \d+, 10 AM/ }),
    ).toHaveLength(12);
  });

  it('shows an empty hint for a week without tasks and the loading state first', async () => {
    renderCalendar(new InMemoryTaskRepository());
    expect(screen.getByText('Loading your tasks')).toBeInTheDocument();
    expect(
      await screen.findByRole('region', { name: 'Nothing planned this week' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole('table', { name: 'Week schedule' }),
      ).toBeInTheDocument(),
    );
  });
});

describe('Calendar – repeating habits', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 22, 14, 0, 0));
  });

  afterEach(() => vi.useRealTimers());

  it('shows a daily habit in every column of this and next week with its repeat rule', async () => {
    const doc = emptyDocument();
    doc.tasks = [
      task({
        id: 'habit',
        title: 'Brush your teeth',
        startDate: '2026-09-01',
        time: '08:00',
        repeat: { kind: 'daily' },
      }),
    ];
    const { user } = renderCalendar(new InMemoryTaskRepository(doc));
    const table = await screen.findByRole('table', { name: 'Week schedule' });

    const name = 'Brush your teeth, 8 AM, repeats every day';
    expect(
      within(rowNamed(table, '8 AM')).getAllByRole('button', { name }),
    ).toHaveLength(7);

    await user.click(screen.getByRole('button', { name: 'Next week' }));
    expect(
      within(rowNamed(table, '8 AM')).getAllByRole('button', { name }),
    ).toHaveLength(7);
  });

  it('shows a weekly Mon/Thu task only in those columns', async () => {
    const doc = emptyDocument();
    doc.tasks = [
      task({
        id: 'gym',
        title: 'Gym',
        startDate: '2026-09-01',
        time: '18:00',
        repeat: { kind: 'weekly', days: [1, 4] },
      }),
    ];
    renderCalendar(new InMemoryTaskRepository(doc));
    const table = await screen.findByRole('table', { name: 'Week schedule' });
    const cells = within(rowNamed(table, '6 PM')).getAllByRole('cell');
    // Week starts Tue 22: Thu is index 2, Mon 28 is index 6.
    const filled = cells
      .map((cell, i) =>
        within(cell).queryByRole('button', { name: /^Gym/ }) ? i : -1,
      )
      .filter((i) => i >= 0);
    expect(filled).toEqual([2, 6]);
  });

  it("keeps tomorrow undone after completing today's occurrence", async () => {
    const doc = emptyDocument();
    doc.tasks = [
      task({
        id: 'habit',
        title: 'Brush your teeth',
        startDate: '2026-09-01',
        time: '08:00',
        repeat: { kind: 'daily' },
      }),
    ];
    const repository = new InMemoryTaskRepository(doc);
    const { user } = renderCalendar(repository);
    const table = await screen.findByRole('table', { name: 'Week schedule' });
    const cells = within(rowNamed(table, '8 AM')).getAllByRole('cell');

    await user.click(within(cells[0]).getByRole('button', { name: /^Brush/ }));
    await user.click(await screen.findByRole('button', { name: 'Mark done' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() =>
      expect(repository.snapshot()?.occurrenceStates).toEqual({
        'habit:2026-09-22': { done: true, doneSubItemIds: [] },
      }),
    );
    await user.click(within(cells[1]).getByRole('button', { name: /^Brush/ }));
    expect(
      await screen.findByRole('button', { name: 'Mark done' }),
    ).toBeInTheDocument();
  });
});
