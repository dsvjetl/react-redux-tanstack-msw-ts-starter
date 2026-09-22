import { screen, waitFor } from '@testing-library/react';

import { usePlannerMutations } from './usePlannerMutations';
import { useTasks } from './useTasks';
import { InMemoryTaskRepository } from '../services/taskRepository/InMemoryTaskRepository';
import { renderWithProviders } from '../utils/testing/renderWithProviders';

const Probe = () => {
  const { doc, status } = useTasks();
  const { createTask, setOccurrenceDone, saveError } = usePlannerMutations();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <ul>
        {doc.tasks.map((t) => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ul>
      <span data-testid="error">{saveError?.message ?? ''}</span>
      <button
        type="button"
        onClick={() =>
          createTask({
            title: 'Make bed',
            startDate: '2026-09-22',
            time: null,
            repeat: { kind: 'none' },
            subItems: [],
          }).catch(() => undefined)
        }
      >
        add
      </button>
      <button
        type="button"
        onClick={() =>
          doc.tasks[0] &&
          setOccurrenceDone(doc.tasks[0].id, doc.tasks[0].startDate, true)
        }
      >
        done
      </button>
    </div>
  );
};

describe('usePlannerMutations', () => {
  it('applies the command to the cache and persists it', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithProviders(<Probe />, { repository });
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('ready'),
    );

    await user.click(screen.getByRole('button', { name: 'add' }));
    expect(await screen.findByText('Make bed')).toBeInTheDocument();
    await waitFor(() =>
      expect(repository.snapshot()?.tasks[0]?.title).toBe('Make bed'),
    );

    await user.click(screen.getByRole('button', { name: 'done' }));
    await waitFor(() =>
      expect(
        Object.values(repository.snapshot()?.occurrenceStates ?? {})[0]?.done,
      ).toBe(true),
    );
  });

  it('rolls back and exposes the error when saving fails', async () => {
    const repository = new InMemoryTaskRepository();
    const { user } = renderWithProviders(<Probe />, { repository });
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('ready'),
    );

    repository.failOnNextSave();
    await user.click(screen.getByRole('button', { name: 'add' }));
    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Simulated save failure',
      ),
    );
    await waitFor(() =>
      expect(screen.queryByText('Make bed')).not.toBeInTheDocument(),
    );
    expect(repository.snapshot()).toBeNull();
  });
});
