import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../constants/queryKeys';
import { type PlannerDocument, emptyDocument } from '../models/PlannerDocument';
import type { LoadResult } from '../services/taskRepository/TaskRepository';
import { useTaskRepository } from '../services/taskRepository/useTaskRepository';

type TasksStatus = 'loading' | 'error' | 'ready';

interface UseTasksResult {
  doc: PlannerDocument;
  status: TasksStatus;
  loadStatus: LoadResult['status'];
  error: Error | null;
}

const plannerQueryKey = [queryKeys.planner] as const;

const useTasks = (): UseTasksResult => {
  const repository = useTaskRepository();
  const query = useQuery<LoadResult, Error>({
    queryKey: plannerQueryKey,
    queryFn: () => repository.load(),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const status: TasksStatus = query.isPending
    ? 'loading'
    : query.isError
      ? 'error'
      : 'ready';

  return {
    doc: query.data?.doc ?? emptyDocument(),
    status,
    loadStatus: query.data?.status ?? 'empty',
    error: query.error ?? null,
  };
};

export { plannerQueryKey, useTasks };
export type { TasksStatus };
