import { useState } from 'react';

import styles from './Calendar.module.scss';
import { useWeekOccurrences } from './hooks/useWeekOccurrences';
import { WeekGrid } from './components/WeekGrid';
import { WeekHeader } from './components/WeekHeader';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { FloatingAddButton } from '../../shared/components/FloatingAddButton';
import { LoadingState } from '../../shared/components/LoadingState';
import { useTaskDetail } from '../../shared/components/TaskDetailDialog/useTaskDetail';
import { usePlannerMutations } from '../../shared/hooks/usePlannerMutations';
import type { Occurrence } from '../../shared/models/Occurrence';
import type { DateKey } from '../../shared/models/Task';
import {
  goToThisWeek,
  nextWeek,
  previousWeek,
} from '../../store/calendarSlice';
import { useAppDispatch } from '../../store/hooks';
import { openCreate } from '../../store/taskEditorSlice';

const Calendar = () => {
  const dispatch = useAppDispatch();
  const {
    today,
    weekStart,
    days,
    byDay,
    rangeLabel,
    isToday,
    isCurrentWeek,
    totalCount,
    status,
    loadStatus,
  } = useWeekOccurrences();
  const { saveError, resetSaveError } = usePlannerMutations();
  const { openTaskDetail } = useTaskDetail();
  const [loadErrorDismissed, setLoadErrorDismissed] = useState(false);

  const open = (occurrence: Occurrence) =>
    openTaskDetail({ taskId: occurrence.taskId, date: occurrence.date });
  const addOn = (date: DateKey) => dispatch(openCreate(date));

  return (
    <div className={styles.page}>
      <WeekHeader
        rangeLabel={rangeLabel}
        isCurrentWeek={isCurrentWeek}
        onPrevious={() => dispatch(previousWeek())}
        onNext={() => dispatch(nextWeek())}
        onThisWeek={() => dispatch(goToThisWeek(today))}
      />

      {loadStatus === 'corrupt' && !loadErrorDismissed ? (
        <div className={styles.notice}>
          <ErrorState
            message="We couldn't load your saved tasks"
            onDismiss={() => setLoadErrorDismissed(true)}
          />
        </div>
      ) : null}
      {saveError ? (
        <div className={styles.notice}>
          <ErrorState
            message="Couldn't save. Try again."
            onDismiss={resetSaveError}
          />
        </div>
      ) : null}

      {status === 'loading' ? (
        <LoadingState />
      ) : (
        <>
          {totalCount === 0 ? (
            <div className={styles.notice}>
              <EmptyState
                title="Nothing planned this week"
                description="Tap a day to add something small."
                actionLabel="Add task"
                onAction={() => addOn(isCurrentWeek ? today : weekStart)}
              />
            </div>
          ) : null}
          <WeekGrid
            days={days}
            byDay={byDay}
            isToday={isToday}
            onOpen={open}
            onAddOn={addOn}
          />
        </>
      )}
      <FloatingAddButton date={isCurrentWeek ? today : weekStart} />
    </div>
  );
};

export default Calendar;
