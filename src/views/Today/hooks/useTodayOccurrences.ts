import { useMemo } from 'react';

import type { Occurrence } from '../../../shared/models/Occurrence';
import { type TasksStatus, useTasks } from '../../../shared/hooks/useTasks';
import { useNow } from '../../../shared/hooks/useNow';
import type { LoadResult } from '../../../shared/services/taskRepository/TaskRepository';
import { addDaysToKey, toDateKey, toTimeKey } from '../../../shared/utils/date';
import { occurrencesInRange } from '../../../shared/utils/occurrences';

/** Undone one-off tasks older than this are no longer shown as overdue. */
const OVERDUE_WINDOW_DAYS = 30;

interface TodayOccurrences {
  today: string;
  overdue: Occurrence[];
  timed: Occurrence[];
  anytime: Occurrence[];
  upNext: Occurrence | null;
  remainingCount: number;
  status: TasksStatus;
  loadStatus: LoadResult['status'];
}

const useTodayOccurrences = (): TodayOccurrences => {
  const { doc, status, loadStatus } = useTasks();
  const now = useNow();
  const today = toDateKey(now);
  const nowTime = toTimeKey(now);

  return useMemo(() => {
    const yesterday = addDaysToKey(today, -1);
    const overdue = occurrencesInRange(
      doc,
      addDaysToKey(today, -OVERDUE_WINDOW_DAYS),
      yesterday,
      today,
    ).filter((occurrence) => occurrence.isOverdue);

    const todays = occurrencesInRange(doc, today, today, today);
    const timed = todays.filter((occurrence) => occurrence.time !== null);
    const anytime = todays.filter((occurrence) => occurrence.time === null);
    const upNext =
      timed.find(
        (occurrence) =>
          !occurrence.done &&
          occurrence.time !== null &&
          occurrence.time >= nowTime,
      ) ?? null;
    const remainingCount = [...overdue, ...todays].filter(
      (o) => !o.done,
    ).length;

    return {
      today,
      overdue,
      timed,
      anytime,
      upNext,
      remainingCount,
      status,
      loadStatus,
    };
  }, [doc, today, nowTime, status, loadStatus]);
};

export { useTodayOccurrences };
