import { useState } from 'react';

import styles from './Today.module.scss';
import { useTodayOccurrences } from './hooks/useTodayOccurrences';
import { AnytimeGroup } from './components/AnytimeGroup';
import { OverdueGroup } from './components/OverdueGroup';
import { TaskTimeline } from './components/TaskTimeline';
import { TodayHeader } from './components/TodayHeader';
import { UpNextCard } from './components/UpNextCard';
import { EmptyState } from '../../shared/components/EmptyState';
import { FloatingAddButton } from '../../shared/components/FloatingAddButton';
import { useTaskDetail } from '../../shared/components/TaskDetailDialog/useTaskDetail';
import { ErrorState } from '../../shared/components/ErrorState';
import { LoadingState } from '../../shared/components/LoadingState';
import { usePlannerMutations } from '../../shared/hooks/usePlannerMutations';
import type { Occurrence } from '../../shared/models/Occurrence';
import { useAppDispatch } from '../../store/hooks';
import { openCreate } from '../../store/taskEditorSlice';

const Today = () => {
  const dispatch = useAppDispatch();
  const {
    today,
    overdue,
    timed,
    anytime,
    upNext,
    remainingCount,
    status,
    loadStatus,
  } = useTodayOccurrences();
  const {
    setOccurrenceDone,
    setSubItemDone,
    moveToToday,
    saveError,
    resetSaveError,
  } = usePlannerMutations();
  const [loadErrorDismissed, setLoadErrorDismissed] = useState(false);
  const { openTaskDetail } = useTaskDetail();

  const isEmpty =
    overdue.length === 0 && timed.length === 0 && anytime.length === 0;

  const toggleDone = (occurrence: Occurrence, done: boolean) =>
    setOccurrenceDone(occurrence.taskId, occurrence.date, done);
  const toggleSubItem = (
    occurrence: Occurrence,
    subItemId: string,
    done: boolean,
  ) => setSubItemDone(occurrence.taskId, occurrence.date, subItemId, done);
  const open = (occurrence: Occurrence) =>
    openTaskDetail({ taskId: occurrence.taskId, date: occurrence.date });

  return (
    <div className={styles.page}>
      <TodayHeader today={today} remainingCount={remainingCount} />

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
      ) : isEmpty ? (
        <EmptyState
          title="No tasks for today"
          description="Plan something small and tick it off."
          actionLabel="Add your first task"
          onAction={() => dispatch(openCreate(today))}
        />
      ) : (
        <>
          <OverdueGroup
            occurrences={overdue}
            onToggleDone={toggleDone}
            onToggleSubItem={toggleSubItem}
            onMoveToToday={(occurrence) => moveToToday(occurrence.taskId)}
            onOpen={open}
          />
          {upNext ? (
            <UpNextCard occurrence={upNext} onOpen={() => open(upNext)} />
          ) : null}
          <TaskTimeline
            occurrences={timed}
            upNextKey={upNext?.key ?? null}
            onToggleDone={toggleDone}
            onToggleSubItem={toggleSubItem}
            onOpen={open}
          />
          <AnytimeGroup
            occurrences={anytime}
            onToggleDone={toggleDone}
            onToggleSubItem={toggleSubItem}
            onOpen={open}
          />
        </>
      )}
      <FloatingAddButton date={today} />
    </div>
  );
};

export default Today;
