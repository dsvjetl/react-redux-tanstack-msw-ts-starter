import { type ReactNode, createContext } from 'react';

import type { TaskRepository } from './TaskRepository';

const TaskRepositoryContext = createContext<TaskRepository | null>(null);

interface TaskRepositoryProviderProps {
  repository: TaskRepository;
  children: ReactNode;
}

const TaskRepositoryProvider = ({
  repository,
  children,
}: TaskRepositoryProviderProps) => (
  <TaskRepositoryContext.Provider value={repository}>
    {children}
  </TaskRepositoryContext.Provider>
);

export { TaskRepositoryContext, TaskRepositoryProvider };
