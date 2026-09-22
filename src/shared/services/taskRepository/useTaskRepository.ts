import { useContext } from 'react';

import type { TaskRepository } from './TaskRepository';
import { TaskRepositoryContext } from './TaskRepositoryContext';

const useTaskRepository = (): TaskRepository => {
  const repository = useContext(TaskRepositoryContext);
  if (!repository) {
    throw new Error(
      'useTaskRepository must be used inside TaskRepositoryProvider',
    );
  }
  return repository;
};

export { useTaskRepository };
