import { act, screen, waitFor, within } from '@testing-library/react';

import { Today } from './index';
import { AppShell } from '../../shared/components/AppShell';
import { emptyDocument } from '../../shared/models/PlannerDocument';
import type { Task } from '../../shared/models/Task';
import { InMemoryTaskRepository } from '../../shared/services/taskRepository/InMemoryTaskRepository';
import { makeOccurrenceKey } from '../../shared/utils/occurrenceKey';
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

const todayFixture = () => ({
  ...emptyDocument(),
  tasks: [
    task({ id: 'meeting', title: 'Client meeting', time: '13:00' }),
    task({
      id: 'read',
      title: 'Read book',
      time: '15:00',
      subItems: [
        { id: 'read-1', text: 'Chapter 4' },
        { id: 'read-2', text: 'Take notes' },
      ],
    }),
    task({ id: 'clean', title: 'Room clean', time: '19:00' }),
    task({ id: 'kitten', title: 'Buy kitten food' }),
  ],
  occurrenceStates: {
    [makeOccurrenceKey('meeting', TODAY)]: { done: true, doneSubItemIds: [] },
  },
});

const renderToday = (repository = new InMemoryTaskRepository(todayFixture())) =>
  renderWithProviders(<Today />, { repository });

describe('Today', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 22, 14, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the loading state first', () => {
    renderToday();
    expect(screen.getByText('Loading your tasks')).toBeInTheDocument();
  });

  it('shows the date heading, remaining badge, ordered timeline and anytime group', async () => {
    renderToday();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tuesday, Sep 22' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: '3 tasks remaining' }),
    ).toBeInTheDocument();

    const timeline = screen.getByRole('list', { name: "Today's schedule" });
    const titles = within(timeline)
      .getAllByRole('article')
      .map((el) => el.getAttribute('aria-label'));
    expect(titles).toEqual(['Client meeting', 'Read book', 'Room clean']);

    const anytime = screen.getByRole('list', { name: 'Anytime' });
    expect(within(anytime).getByRole('article')).toHaveAttribute(
      'aria-label',
      'Buy kitten food',
    );
  });

  it('highlights the next undone timed task as Up next', async () => {
    renderToday();
    const upNext = await screen.findByRole('region', { name: 'Up next' });
    expect(upNext).toHaveTextContent('Read book');
    expect(upNext).toHaveTextContent('3 PM');
  });

  it('hides Up next when every timed task is done or past', async () => {
    const doc = todayFixture();
    doc.occurrenceStates[makeOccurrenceKey('read', TODAY)] = {
      done: true,
      doneSubItemIds: [],
    };
    doc.occurrenceStates[makeOccurrenceKey('clean', TODAY)] = {
      done: true,
      doneSubItemIds: [],
    };
    renderToday(new InMemoryTaskRepository(doc));
    await screen.findByRole('heading', { level: 1 });
    expect(
      screen.queryByRole('region', { name: 'Up next' }),
    ).not.toBeInTheDocument();
  });

  it('marks a task done, updates the badge and keeps the card in place', async () => {
    const repository = new InMemoryTaskRepository(todayFixture());
    const { user } = renderToday(repository);
    const checkbox = await screen.findByRole('checkbox', {
      name: 'Mark Read book done',
    });

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(
      screen.getByRole('status', { name: '2 tasks remaining' }),
    ).toBeInTheDocument();
    const timeline = screen.getByRole('list', { name: "Today's schedule" });
    expect(within(timeline).getAllByRole('article')[1]).toHaveAttribute(
      'aria-label',
      'Read book',
    );
    await waitFor(() =>
      expect(
        repository.snapshot()?.occurrenceStates[
          makeOccurrenceKey('read', TODAY)
        ]?.done,
      ).toBe(true),
    );
  });

  it('keeps sub-item completion independent from the task', async () => {
    const { user } = renderToday();
    const card = await screen.findByRole('article', { name: 'Read book' });

    await user.click(within(card).getByRole('checkbox', { name: 'Chapter 4' }));
    await user.click(
      within(card).getByRole('checkbox', { name: 'Take notes' }),
    );

    expect(
      within(card).getByRole('checkbox', { name: 'Chapter 4' }),
    ).toBeChecked();
    expect(
      within(card).getByRole('checkbox', { name: 'Mark Read book done' }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('status', { name: '3 tasks remaining' }),
    ).toBeInTheDocument();
  });

  it('shows the empty state with an add action when there is nothing today', async () => {
    renderToday(new InMemoryTaskRepository());
    expect(
      await screen.findByRole('region', { name: 'No tasks for today' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add your first task' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: '0 tasks remaining' }),
    ).toBeInTheDocument();
  });

  it('shows a dismissible alert when saved tasks could not be loaded', async () => {
    const repository = {
      load: async () => ({
        status: 'corrupt' as const,
        doc: emptyDocument(),
        reason: 'bad json',
      }),
      save: async () => undefined,
    };
    const { user } = renderWithProviders(<Today />, { repository });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("We couldn't load your saved tasks");
    await user.click(within(alert).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'No tasks for today' }),
    ).toBeInTheDocument();
  });
});

describe('Today – add, edit and delete', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 22, 14, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderShell = (repository = new InMemoryTaskRepository()) =>
    renderWithProviders(
      <AppShell>
        <Today />
      </AppShell>,
      { repository },
    );

  it('creates, edits, moves and deletes a task, and persists it', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderShell(repository);
    await screen.findByRole('region', { name: 'No tasks for today' });

    // create
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    const create = await screen.findByRole('dialog', { name: 'New task' });
    expect(within(create).getByLabelText('Date')).toHaveValue(TODAY);
    await user.type(
      within(create).getByRole('textbox', { name: 'Title' }),
      'Make bed',
    );
    await user.click(within(create).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    const anytime = await screen.findByRole('list', { name: 'Anytime' });
    expect(
      within(anytime).getByRole('article', { name: 'Make bed' }),
    ).toBeInTheDocument();

    // edit: time + sub-item
    await user.click(screen.getByRole('button', { name: 'Make bed' }));
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const edit = await screen.findByRole('dialog', { name: 'Edit task' });
    await user.type(within(edit).getByLabelText('Time'), '08:00');
    await user.click(
      within(edit).getByRole('button', { name: 'Add sub-item' }),
    );
    await user.type(
      within(edit).getByRole('textbox', { name: 'Sub-item 1' }),
      'Fluff pillows',
    );
    await user.click(within(edit).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    const timeline = await screen.findByRole('list', {
      name: "Today's schedule",
    });
    const card = within(timeline).getByRole('article', { name: 'Make bed' });
    expect(
      within(card).getByRole('checkbox', { name: 'Fluff pillows' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Anytime' }),
    ).not.toBeInTheDocument();

    // move 3 days ahead: leaves Today
    await user.click(screen.getByRole('button', { name: 'Make bed' }));
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const edit2 = await screen.findByRole('dialog', { name: 'Edit task' });
    const dateInput = within(edit2).getByLabelText('Date');
    await user.clear(dateInput);
    await user.type(dateInput, '2026-09-25');
    await user.click(within(edit2).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByRole('region', { name: 'No tasks for today' }),
    ).toBeInTheDocument();
    expect(repository.snapshot()?.tasks[0]).toMatchObject({
      startDate: '2026-09-25',
      time: '08:00',
    });

    // persistence: a fresh render with the same repository
    const first = repository.snapshot();
    expect(first?.tasks).toHaveLength(1);
  });

  it('deletes a task from the detail dialog', async () => {
    const repository = new InMemoryTaskRepository(todayFixture());
    const { user } = renderShell(repository);
    await user.click(
      await screen.findByRole('button', { name: 'Buy kitten food' }),
    );
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    const confirm = await screen.findByRole('alertdialog', {
      name: 'Delete this task?',
    });
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('article', { name: 'Buy kitten food' }),
      ).not.toBeInTheDocument(),
    );
    expect(repository.snapshot()?.tasks.map((t) => t.id)).not.toContain(
      'kitten',
    );
  });

  it('shows persisted tasks on a later launch', async () => {
    const repository = new InMemoryTaskRepository();
    const first = renderShell(repository);
    await first.user.click(
      await screen.findByRole('button', { name: 'Add your first task' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await first.user.type(
      within(dialog).getByRole('textbox', { name: 'Title' }),
      'Water plants',
    );
    await first.user.click(
      within(dialog).getByRole('button', { name: 'Save' }),
    );
    await waitFor(() => expect(repository.snapshot()?.tasks).toHaveLength(1));
    first.unmount();

    renderShell(repository);
    expect(
      await screen.findByRole('article', { name: 'Water plants' }),
    ).toBeInTheDocument();
  });
});

describe('Today – repeating habits and overdue', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 22, 14, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const habit = task({
    id: 'habit',
    title: 'Brush your teeth',
    startDate: '2026-09-01',
    time: '08:00',
    repeat: { kind: 'daily' },
  });

  it("shows a repeat badge and completes only today's occurrence", async () => {
    const repository = new InMemoryTaskRepository({
      ...emptyDocument(),
      tasks: [habit],
    });
    const { user } = renderToday(repository);

    const card = await screen.findByRole('article', {
      name: 'Brush your teeth',
    });
    expect(
      within(card).getByRole('img', { name: 'Repeats every day' }),
    ).toBeInTheDocument();

    await user.click(
      within(card).getByRole('checkbox', {
        name: 'Mark Brush your teeth done',
      }),
    );

    await waitFor(() =>
      expect(repository.snapshot()?.occurrenceStates).toEqual({
        [makeOccurrenceKey('habit', TODAY)]: { done: true, doneSubItemIds: [] },
      }),
    );
    expect(
      screen.getByRole('status', { name: '0 tasks remaining' }),
    ).toBeInTheDocument();
  });

  it('never lists missed repeating occurrences as overdue, but lists one-off ones', async () => {
    const repository = new InMemoryTaskRepository({
      ...emptyDocument(),
      tasks: [
        habit,
        task({
          id: 'old',
          title: 'Return library books',
          startDate: '2026-09-21',
          time: '10:00',
        }),
        task({ id: 'doneOld', title: 'Water plants', startDate: '2026-09-21' }),
        task({ id: 'ancient', title: 'Ancient', startDate: '2026-08-01' }),
      ],
      occurrenceStates: {
        [makeOccurrenceKey('doneOld', '2026-09-21')]: {
          done: true,
          doneSubItemIds: [],
        },
      },
    });
    renderToday(repository);

    const overdue = await screen.findByRole('region', { name: 'Overdue' });
    const cards = within(overdue).getAllByRole('article');
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Return library books',
    ]);
    expect(overdue).toHaveTextContent('Monday, Sep 21');
    expect(
      screen.getByRole('status', { name: '2 tasks remaining' }),
    ).toBeInTheDocument();
  });

  it('moves an overdue task to today', async () => {
    const repository = new InMemoryTaskRepository({
      ...emptyDocument(),
      tasks: [
        task({
          id: 'old',
          title: 'Return library books',
          startDate: '2026-09-21',
          time: '10:00',
        }),
      ],
    });
    const { user } = renderToday(repository);

    await user.click(
      await screen.findByRole('button', { name: 'Move to today' }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Overdue' }),
      ).not.toBeInTheDocument(),
    );
    const timeline = screen.getByRole('list', { name: "Today's schedule" });
    expect(
      within(timeline).getByRole('article', { name: 'Return library books' }),
    ).toBeInTheDocument();
    expect(repository.snapshot()?.tasks[0].startDate).toBe(TODAY);
  });
});

describe('Today – midnight rollover', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves to the new day and turns yesterday's undone task into overdue", async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date(2026, 8, 22, 23, 59, 30));
    const repository = new InMemoryTaskRepository({
      ...emptyDocument(),
      tasks: [task({ id: 'late', title: 'Late task', time: '23:00' })],
    });
    renderWithProviders(<Today />, { repository });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tuesday, Sep 22' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: "Today's schedule" }),
    ).toBeInTheDocument();

    await act(async () => {
      vi.setSystemTime(new Date(2026, 8, 23, 0, 0, 5));
      vi.advanceTimersByTime(30_000);
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Wednesday, Sep 23' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: "Today's schedule" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Overdue' })).getByRole(
        'article',
        {
          name: 'Late task',
        },
      ),
    ).toBeInTheDocument();
  });
});
