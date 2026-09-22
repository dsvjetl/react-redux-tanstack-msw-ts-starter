import { useContext } from 'react';

import {
  TaskDetailContext,
  type TaskDetailContextValue,
} from './TaskDetailContext';

const noop = () => undefined;

/** Falls back to no-ops outside the provider so views stay renderable alone. */
const useTaskDetail = (): TaskDetailContextValue => {
  const value = useContext(TaskDetailContext);
  return value ?? { target: null, openTaskDetail: noop, closeTaskDetail: noop };
};

export { useTaskDetail };
