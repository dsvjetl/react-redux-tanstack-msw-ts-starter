import {
  type ReactNode,
  createContext,
  useCallback,
  useMemo,
  useState,
} from 'react';

import type { DateKey } from '../../models/Task';

interface TaskDetailTarget {
  taskId: string;
  date: DateKey;
}

interface TaskDetailContextValue {
  target: TaskDetailTarget | null;
  openTaskDetail: (target: TaskDetailTarget) => void;
  closeTaskDetail: () => void;
}

const TaskDetailContext = createContext<TaskDetailContextValue | null>(null);

const TaskDetailProvider = ({ children }: { children: ReactNode }) => {
  const [target, setTarget] = useState<TaskDetailTarget | null>(null);
  const openTaskDetail = useCallback(
    (next: TaskDetailTarget) => setTarget(next),
    [],
  );
  const closeTaskDetail = useCallback(() => setTarget(null), []);
  const value = useMemo(
    () => ({ target, openTaskDetail, closeTaskDetail }),
    [target, openTaskDetail, closeTaskDetail],
  );
  return (
    <TaskDetailContext.Provider value={value}>
      {children}
    </TaskDetailContext.Provider>
  );
};

export { TaskDetailContext, TaskDetailProvider };
export type { TaskDetailContextValue };
