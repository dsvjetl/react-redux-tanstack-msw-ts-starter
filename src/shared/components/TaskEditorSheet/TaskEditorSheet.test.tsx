import { screen, waitFor, within } from '@testing-library/react';

import { TaskEditorSheet } from './index';
import { emptyDocument } from '../../models/PlannerDocument';
import type { Task } from '../../models/Task';
import { InMemoryTaskRepository } from '../../services/taskRepository/InMemoryTaskRepository';
import { renderWithProviders } from '../../utils/testing/renderWithProviders';

const TODAY = '2026-09-22';

const oneOff: Task = {
  id: 'bed',
  title: 'Make bed',
  startDate: TODAY,
  time: '08:00',
  repeat: { kind: 'none' },
  endDate: null,
  subItems: [{ id: 'bed-1', text: 'Fluff pillows' }],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const renderCreate = (repository = new InMemoryTaskRepository()) =>
  renderWithProviders(<TaskEditorSheet />, {
    repository,
    preloadedState: { taskEditor: { mode: 'create', date: TODAY } },
  });

describe('TaskEditorSheet (create)', () => {
  it('opens with the date prefilled and focus in the title', async () => {
    renderCreate();

    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    expect(within(dialog).getByLabelText('Date')).toHaveValue(TODAY);
    await waitFor(() =>
      expect(
        within(dialog).getByRole('textbox', { name: 'Title' }),
      ).toHaveFocus(),
    );
  });

  it('blocks saving without a title', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderCreate(repository);
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(repository.snapshot()).toBeNull();
  });

  it('validates title length, time steps and sub-item text', async () => {
    const { user } = renderCreate();
    await screen.findByRole('dialog');

    await user.type(
      screen.getByRole('textbox', { name: 'Title' }),
      'a'.repeat(121),
    );
    await user.type(screen.getByLabelText('Time'), '08:03');
    await user.click(screen.getByRole('button', { name: 'Add sub-item' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Sub-item 1' }),
      'b'.repeat(81),
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Keep the title under 120 characters'),
    ).toBeInTheDocument();
    expect(screen.getByText('Use 5-minute steps')).toBeInTheDocument();
    expect(screen.getByText('Keep it under 80 characters')).toBeInTheDocument();
  });

  it('caps sub-items at ten', async () => {
    const { user } = renderCreate();
    await screen.findByRole('dialog');
    const add = screen.getByRole('button', { name: 'Add sub-item' });
    for (let i = 0; i < 10; i += 1) {
      await user.click(add);
    }
    expect(add).toBeDisabled();
    expect(
      screen.getAllByRole('textbox', { name: /Sub-item \d+/ }),
    ).toHaveLength(10);
  });

  it('requires a weekday for weekly repeats', async () => {
    const { user } = renderCreate();
    await screen.findByRole('dialog');

    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Gym');
    await user.click(screen.getByRole('radio', { name: 'Weekly' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Pick at least one day'),
    ).toBeInTheDocument();
  });

  it('creates a task and closes', async () => {
    const repository = new InMemoryTaskRepository();
    const { user, store } = renderCreate(repository);
    await screen.findByRole('dialog');

    await user.type(
      screen.getByRole('textbox', { name: 'Title' }),
      'Read a book',
    );
    await user.type(screen.getByLabelText('Time'), '20:00');
    await user.click(screen.getByRole('button', { name: 'Add sub-item' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Sub-item 1' }),
      'Chapter 1',
    );
    await user.click(screen.getByRole('radio', { name: 'Every day' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(store.getState().taskEditor).toEqual({ mode: 'closed' }),
    );
    const saved = repository.snapshot()?.tasks[0];
    expect(saved).toMatchObject({
      title: 'Read a book',
      startDate: TODAY,
      time: '20:00',
      repeat: { kind: 'daily' },
    });
    expect(saved?.subItems[0].text).toBe('Chapter 1');
  });

  it('closes on Cancel and Escape without saving', async () => {
    const repository = new InMemoryTaskRepository();
    const { user, store } = renderCreate(repository);
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(store.getState().taskEditor).toEqual({ mode: 'closed' });
    expect(repository.snapshot()).toBeNull();
  });
});

describe('TaskEditorSheet (edit)', () => {
  it('prefills every field for a one-off task and updates it', async () => {
    const repository = new InMemoryTaskRepository({
      ...emptyDocument(),
      tasks: [oneOff],
    });
    const { user, store } = renderWithProviders(<TaskEditorSheet />, {
      repository,
      preloadedState: {
        taskEditor: { mode: 'edit', taskId: 'bed', date: TODAY },
      },
    });

    const dialog = await screen.findByRole('dialog', { name: 'Edit task' });
    expect(within(dialog).getByRole('textbox', { name: 'Title' })).toHaveValue(
      'Make bed',
    );
    expect(within(dialog).getByLabelText('Time')).toHaveValue('08:00');
    expect(
      within(dialog).getByRole('textbox', { name: 'Sub-item 1' }),
    ).toHaveValue('Fluff pillows');

    await user.clear(within(dialog).getByRole('textbox', { name: 'Title' }));
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Title' }),
      'Make the bed',
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Clear time' }),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(store.getState().taskEditor).toEqual({ mode: 'closed' }),
    );
    expect(repository.snapshot()?.tasks[0]).toMatchObject({
      id: 'bed',
      title: 'Make the bed',
      time: null,
    });
    expect(repository.snapshot()?.tasks[0].subItems[0].id).toBe('bed-1');
  });

  it('asks for the series scope when editing a repeating occurrence', async () => {
    const habit: Task = {
      ...oneOff,
      id: 'habit',
      title: 'Brush your teeth',
      startDate: '2026-09-01',
      repeat: { kind: 'daily' },
      subItems: [],
    };
    const repository = new InMemoryTaskRepository({
      ...emptyDocument(),
      tasks: [habit],
    });
    const { user, store } = renderWithProviders(<TaskEditorSheet />, {
      repository,
      preloadedState: {
        taskEditor: { mode: 'edit', taskId: 'habit', date: '2026-09-24' },
      },
    });

    const dialog = await screen.findByRole('dialog', { name: 'Edit task' });
    expect(within(dialog).queryByLabelText('Date')).not.toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText('Time'));
    await user.type(within(dialog).getByLabelText('Time'), '09:00');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('alertdialog', {
        name: 'Apply to which occurrences?',
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'This and all future occurrences' }),
    );

    await waitFor(() =>
      expect(store.getState().taskEditor).toEqual({ mode: 'closed' }),
    );
    const tasks = repository.snapshot()?.tasks ?? [];
    expect(tasks).toHaveLength(2);
    expect(tasks.find((t) => t.id === 'habit')?.endDate).toBe('2026-09-23');
    expect(tasks.find((t) => t.id !== 'habit')).toMatchObject({
      startDate: '2026-09-24',
      time: '09:00',
    });
  });
});
