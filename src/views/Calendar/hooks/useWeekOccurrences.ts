import { useMemo } from 'react';

import type { Occurrence } from '../../../shared/models/Occurrence';
import { type TasksStatus, useTasks } from '../../../shared/hooks/useTasks';
import { useNow } from '../../../shared/hooks/useNow';
import type { LoadResult } from '../../../shared/services/taskRepository/TaskRepository';
import type { DateKey } from '../../../shared/models/Task';
import {
  formatRangeLabel,
  toDateKey,
  weekDays,
} from '../../../shared/utils/date';
import { occurrencesInRange } from '../../../shared/utils/occurrences';
import { useAppSelector } from '../../../store/hooks';

interface DayOccurrences {
  anytime: Occurrence[];
  timed: Occurrence[];
}

interface WeekOccurrences {
  today: DateKey;
  weekStart: DateKey;
  days: DateKey[];
  byDay: Record<DateKey, DayOccurrences>;
  rangeLabel: string;
  isToday: (date: DateKey) => boolean;
  isCurrentWeek: boolean;
  totalCount: number;
  status: TasksStatus;
  loadStatus: LoadResult['status'];
}

const useWeekOccurrences = (): WeekOccurrences => {
  const { doc, status, loadStatus } = useTasks();
  const weekStart = useAppSelector((state) => state.calendar.weekStart);
  const now = useNow();
  const today = toDateKey(now);

  return useMemo(() => {
    const days = weekDays(weekStart);
    const byDay: Record<DateKey, DayOccurrences> = {};
    for (const day of days) byDay[day] = { anytime: [], timed: [] };

    const occurrences = occurrencesInRange(doc, days[0], days[6], today);
    for (const occurrence of occurrences) {
      const bucket = byDay[occurrence.date];
      if (!bucket) continue;
      (occurrence.time === null ? bucket.anytime : bucket.timed).push(
        occurrence,
      );
    }

    return {
      today,
      weekStart,
      days,
      byDay,
      rangeLabel: formatRangeLabel(days[0], days[6]),
      isToday: (date: DateKey) => date === today,
      isCurrentWeek: weekStart === today,
      totalCount: occurrences.length,
      status,
      loadStatus,
    };
  }, [doc, weekStart, today, status, loadStatus]);
};

export { useWeekOccurrences };
export type { DayOccurrences };
