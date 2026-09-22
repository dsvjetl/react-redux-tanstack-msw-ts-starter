import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useTodayOccurrences } from './useTodayOccurrences';
import { emptyDocument } from '../../../shared/models/PlannerDocument';
import type { Task } from '../../../shared/models/Task';
import { InMemoryTaskRepository } from '../../../shared/services/taskRepository/InMemoryTaskRepository';
import { TaskRepositoryProvider } from '../../../shared/services/taskRepository/TaskRepositoryContext';
import { makeOccurrenceKey } from '../../../shared/utils/occurrenceKey';

const task = (overrides: Partial<Task> & { id: string }): Task => ({
  title: overrides.id,
  startDate: '2026-09-22',
  time: null,
  repeat: { kind: 'none' },
  endDate: null,
  subItems: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const setup = (
  tasks: Task[],
  states: Record<string, { done: boolean; doneSubItemIds: string[] }> = {},
) => {
  const repository = new InMemoryTaskRepository({
    ...emptyDocument(),
    tasks,
    occurrenceStates: states,
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TaskRepositoryProvider repository={repository}>
        {children}
      </TaskRepositoryProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useTodayOccurrences(), { wrapper });
};

describe('useTodayOccurrences', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 22, 14, 0));
  });

  afterEach(() => vi.useRealTimers());

  it('splits today into timed, anytime and up next, and counts remaining', async () => {
    const { result } = setup(
      [
        task({ id: 'a', time: '13:00' }),
        task({ id: 'b', time: '15:00' }),
        task({ id: 'c', time: '19:00' }),
        task({ id: 'd' }),
        task({ id: 'tomorrow', startDate: '2026-09-23', time: '09:00' }),
      ],
      {
        [makeOccurrenceKey('a', '2026-09-22')]: {
          done: true,
          doneSubItemIds: [],
        },
      },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.timed.map((o) => o.taskId)).toEqual(['a', 'b', 'c']);
    expect(result.current.anytime.map((o) => o.taskId)).toEqual(['d']);
    expect(result.current.upNext?.taskId).toBe('b');
    expect(result.current.remainingCount).toBe(3);
  });

  it('lists undone one-off tasks from the last 30 days as overdue, excluding repeats', async () => {
    const { result } = setup(
      [
        task({ id: 'old', startDate: '2026-09-20' }),
        task({ id: 'ancient', startDate: '2026-08-01' }),
        task({ id: 'doneOld', startDate: '2026-09-21' }),
        task({
          id: 'habit',
          startDate: '2026-09-01',
          repeat: { kind: 'daily' },
        }),
      ],
      {
        [makeOccurrenceKey('doneOld', '2026-09-21')]: {
          done: true,
          doneSubItemIds: [],
        },
      },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.overdue.map((o) => o.taskId)).toEqual(['old']);
    expect(result.current.remainingCount).toBe(2); // old + today's habit
  });

  it('returns no up next when nothing is left', async () => {
    const { result } = setup([task({ id: 'past', time: '09:00' })]);
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.upNext).toBeNull();
  });
});
