import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { emptyDocument } from '../models/PlannerDocument';
import type { DateKey, OccurrenceInput, TaskInput } from '../models/Task';
import type { LoadResult } from '../services/taskRepository/TaskRepository';
import { useTaskRepository } from '../services/taskRepository/useTaskRepository';
import {
  type PlannerCommand,
  type SeriesScope,
  applyCommand,
} from '../utils/plannerCommands';
import { plannerQueryKey } from './useTasks';

const newId = () => crypto.randomUUID();

/**
 * Every change goes through `run(command)`: the command is applied to the
 * cached document immediately, then persisted. On failure the cache is
 * restored from storage and `saveError` is set.
 */
const usePlannerMutations = () => {
  const repository = useTaskRepository();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    Error,
    PlannerCommand,
    { previous?: LoadResult }
  >({
    onMutate: async (command) => {
      await queryClient.cancelQueries({ queryKey: plannerQueryKey });
      const previous = queryClient.getQueryData<LoadResult>(plannerQueryKey);
      const nextDoc = applyCommand(previous?.doc ?? emptyDocument(), command, {
        now: new Date(),
        newId,
      });
      queryClient.setQueryData<LoadResult>(plannerQueryKey, {
        status: 'ok',
        doc: nextDoc,
      });
      return { previous };
    },
    mutationFn: async () => {
      const current = queryClient.getQueryData<LoadResult>(plannerQueryKey);
      await repository.save(current?.doc ?? emptyDocument());
    },
    onError: async (_error, _command, context) => {
      if (context?.previous) {
        queryClient.setQueryData(plannerQueryKey, context.previous);
      }
      await queryClient.invalidateQueries({ queryKey: plannerQueryKey });
    },
  });

  const run = mutation.mutateAsync;
  const fire = mutation.mutate;

  const createTask = useCallback(
    (input: TaskInput) => run({ type: 'createTask', input }),
    [run],
  );
  const updateTask = useCallback(
    (taskId: string, input: TaskInput) =>
      run({ type: 'updateTask', taskId, input }),
    [run],
  );
  const updateOccurrence = useCallback(
    (
      taskId: string,
      date: DateKey,
      scope: SeriesScope,
      input: OccurrenceInput,
    ) => run({ type: 'updateOccurrence', taskId, date, scope, input }),
    [run],
  );
  const deleteTask = useCallback(
    (taskId: string) => run({ type: 'deleteTask', taskId }),
    [run],
  );
  const deleteOccurrence = useCallback(
    (taskId: string, date: DateKey, scope: SeriesScope) =>
      run({ type: 'deleteOccurrence', taskId, date, scope }),
    [run],
  );
  const endRepeat = useCallback(
    (taskId: string) => run({ type: 'endRepeat', taskId }),
    [run],
  );
  const setOccurrenceDone = useCallback(
    (taskId: string, date: DateKey, done: boolean) =>
      fire({ type: 'setOccurrenceDone', taskId, date, done }),
    [fire],
  );
  const setSubItemDone = useCallback(
    (taskId: string, date: DateKey, subItemId: string, done: boolean) =>
      fire({ type: 'setSubItemDone', taskId, date, subItemId, done }),
    [fire],
  );
  const moveToToday = useCallback(
    (taskId: string) => fire({ type: 'moveToToday', taskId }),
    [fire],
  );

  return {
    run,
    createTask,
    updateTask,
    updateOccurrence,
    deleteTask,
    deleteOccurrence,
    endRepeat,
    setOccurrenceDone,
    setSubItemDone,
    moveToToday,
    isSaving: mutation.isPending,
    saveError: mutation.error,
    resetSaveError: mutation.reset,
  };
};

export { usePlannerMutations };
