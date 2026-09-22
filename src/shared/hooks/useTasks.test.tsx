import { screen, waitFor } from '@testing-library/react';

import { useTasks } from './useTasks';
import { emptyDocument } from '../models/PlannerDocument';
import { InMemoryTaskRepository } from '../services/taskRepository/InMemoryTaskRepository';
import { renderWithProviders } from '../utils/testing/renderWithProviders';

const Probe = () => {
  const { status, loadStatus, doc } = useTasks();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="load">{loadStatus}</span>
      <span data-testid="count">{doc.tasks.length}</span>
    </div>
  );
};

describe('useTasks', () => {
  it('goes from loading to ready with the repository document', async () => {
    const repository = new InMemoryTaskRepository({
      ...emptyDocument(),
      tasks: [
        {
          id: 'a',
          title: 'A',
          startDate: '2026-09-22',
          time: null,
          repeat: { kind: 'none' },
          endDate: null,
          subItems: [],
          createdAt: '2026-09-22T00:00:00.000Z',
          updatedAt: '2026-09-22T00:00:00.000Z',
        },
      ],
    });
    renderWithProviders(<Probe />, { repository });

    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('ready'),
    );
    expect(screen.getByTestId('load')).toHaveTextContent('ok');
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('exposes corrupt load status', async () => {
    const repository = {
      load: async () => ({
        status: 'corrupt' as const,
        doc: emptyDocument(),
        reason: 'bad',
      }),
      save: async () => undefined,
    };
    renderWithProviders(<Probe />, { repository });
    await waitFor(() =>
      expect(screen.getByTestId('load')).toHaveTextContent('corrupt'),
    );
  });
});
