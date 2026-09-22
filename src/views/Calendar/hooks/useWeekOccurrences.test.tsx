import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';

import { useWeekOccurrences } from './useWeekOccurrences';
import { emptyDocument } from '../../../shared/models/PlannerDocument';
import type { Task } from '../../../shared/models/Task';
import { InMemoryTaskRepository } from '../../../shared/services/taskRepository/InMemoryTaskRepository';
import { TaskRepositoryProvider } from '../../../shared/services/taskRepository/TaskRepositoryContext';
import { setupStore } from '../../../store';

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

const setup = (tasks: Task[], weekStart = '2026-09-22') => {
  const repository = new InMemoryTaskRepository({ ...emptyDocument(), tasks });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = setupStore({ calendar: { weekStart } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <TaskRepositoryProvider repository={repository}>
          {children}
        </TaskRepositoryProvider>
      </Provider>
    </QueryClientProvider>
  );
  return renderHook(() => useWeekOccurrences(), { wrapper });
};

describe('useWeekOccurrences', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 22, 14, 0));
  });

  afterEach(() => vi.useRealTimers());

  it('groups occurrences by day, splitting anytime and timed in order', async () => {
    const { result } = setup([
      task({ id: 'late', startDate: '2026-09-24', time: '19:00' }),
      task({ id: 'early', startDate: '2026-09-24', time: '09:00' }),
      task({ id: 'any', startDate: '2026-09-24' }),
      task({
        id: 'habit',
        startDate: '2026-09-01',
        repeat: { kind: 'daily' },
        time: '08:00',
      }),
      task({ id: 'outside', startDate: '2026-10-05' }),
    ]);
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.days).toHaveLength(7);
    expect(result.current.days[0]).toBe('2026-09-22');
    expect(
      result.current.byDay['2026-09-24'].timed.map((o) => o.taskId),
    ).toEqual(['habit', 'early', 'late']);
    expect(
      result.current.byDay['2026-09-24'].anytime.map((o) => o.taskId),
    ).toEqual(['any']);
    expect(
      result.current.byDay['2026-09-28'].timed.map((o) => o.taskId),
    ).toEqual(['habit']);
    expect(result.current.totalCount).toBe(10);
  });

  it('labels the range and knows today and the current week', async () => {
    const { result } = setup([]);
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.rangeLabel).toBe('22 – 28 Sep');
    expect(result.current.isToday('2026-09-22')).toBe(true);
    expect(result.current.isToday('2026-09-23')).toBe(false);
    expect(result.current.isCurrentWeek).toBe(true);
  });

  it('crosses month boundaries', async () => {
    const { result } = setup([], '2026-09-28');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.rangeLabel).toBe('28 Sep – 4 Oct');
    expect(result.current.isCurrentWeek).toBe(false);
  });
});
