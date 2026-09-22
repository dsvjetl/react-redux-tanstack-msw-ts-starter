import { screen, waitFor, within } from '@testing-library/react';

import { TaskDetailDialog } from './index';
import { TaskDetailProvider } from './TaskDetailContext';
import { useTaskDetail } from './useTaskDetail';
import { emptyDocument } from '../../models/PlannerDocument';
import type { Task } from '../../models/Task';
import { InMemoryTaskRepository } from '../../services/taskRepository/InMemoryTaskRepository';
import { renderWithProviders } from '../../utils/testing/renderWithProviders';

const TODAY = '2026-09-22';

const oneOff: Task = {
  id: 'read',
  title: 'Read book',
  startDate: TODAY,
  time: '15:00',
  repeat: { kind: 'none' },
  endDate: null,
  subItems: [{ id: 'read-1', text: 'Chapter 4' }],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const habit: Task = {
  ...oneOff,
  id: 'habit',
  title: 'Brush your teeth',
  startDate: '2026-09-01',
  time: '08:00',
  repeat: { kind: 'daily' },
  subItems: [],
};

const Opener = ({ taskId, date }: { taskId: string; date: string }) => {
  const { openTaskDetail } = useTaskDetail();
  return (
    <button type="button" onClick={() => openTaskDetail({ taskId, date })}>
      open
    </button>
  );
};

const setup = (tasks: Task[], taskId: string, date = TODAY) => {
  const repository = new InMemoryTaskRepository({ ...emptyDocument(), tasks });
  const utils = renderWithProviders(
    <TaskDetailProvider>
      <Opener taskId={taskId} date={date} />
      <TaskDetailDialog />
    </TaskDetailProvider>,
    { repository },
  );
  return { ...utils, repository };
};

describe('TaskDetailDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 22, 14, 0));
  });

  afterEach(() => vi.useRealTimers());

  it('shows the occurrence and toggles done', async () => {
    const { user, repository } = setup([oneOff], 'read');
    await user.click(screen.getByRole('button', { name: 'open' }));

    const dialog = await screen.findByRole('dialog', { name: 'Read book' });
    expect(dialog).toHaveTextContent('Tuesday, Sep 22');
    expect(dialog).toHaveTextContent('3 PM');
    expect(
      within(dialog).getByRole('checkbox', { name: 'Chapter 4' }),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Mark done' }));
    expect(
      await within(dialog).findByRole('button', { name: 'Mark not done' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        repository.snapshot()?.occurrenceStates[`read:${TODAY}`]?.done,
      ).toBe(true),
    );
  });

  it('dispatches edit mode and closes', async () => {
    const { user, store } = setup([oneOff], 'read');
    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(store.getState().taskEditor).toEqual({
      mode: 'edit',
      taskId: 'read',
      date: TODAY,
    });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('deletes a one-off task after confirmation', async () => {
    const { user, repository } = setup([oneOff], 'read');
    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    const confirm = await screen.findByRole('alertdialog', {
      name: 'Delete this task?',
    });
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(repository.snapshot()?.tasks).toEqual([]));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('closes with the Close button', async () => {
    const { user } = setup([oneOff], 'read');
    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('offers End repeat and series-scoped delete for repeating tasks', async () => {
    const { user, repository } = setup([habit], 'habit', '2026-09-24');
    await user.click(screen.getByRole('button', { name: 'open' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'Brush your teeth',
    });
    expect(within(dialog).getByText('Repeats every day')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    const scope = await screen.findByRole('alertdialog', {
      name: 'Apply to which occurrences?',
    });
    await user.click(
      within(scope).getByRole('button', { name: 'This occurrence only' }),
    );
    await waitFor(() =>
      expect(repository.snapshot()?.overrides['habit:2026-09-24']).toEqual({
        deleted: true,
      }),
    );
  });

  it('ends a repeat after confirmation', async () => {
    const { user, repository } = setup([habit], 'habit', TODAY);
    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.click(await screen.findByRole('button', { name: 'End repeat' }));
    const confirm = await screen.findByRole('alertdialog', {
      name: 'Stop repeating?',
    });
    await user.click(
      within(confirm).getByRole('button', { name: 'End repeat' }),
    );
    await waitFor(() =>
      expect(repository.snapshot()?.tasks[0].endDate).toBe(TODAY),
    );
  });

  it('offers Move to today for overdue tasks', async () => {
    const overdue: Task = {
      ...oneOff,
      id: 'old',
      title: 'Old task',
      startDate: '2026-09-20',
    };
    const { user, repository } = setup([overdue], 'old', '2026-09-20');
    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.click(
      await screen.findByRole('button', { name: 'Move to today' }),
    );
    await waitFor(() =>
      expect(repository.snapshot()?.tasks[0].startDate).toBe(TODAY),
    );
  });
});
