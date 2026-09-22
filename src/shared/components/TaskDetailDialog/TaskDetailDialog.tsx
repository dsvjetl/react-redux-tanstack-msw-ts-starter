import { useEffect, useState } from 'react';
import { Repeat, X } from 'lucide-react';
import { Dialog } from 'radix-ui';

import styles from './TaskDetailDialog.module.scss';
import { useTaskDetail } from './useTaskDetail';
import { usePlannerMutations } from '../../hooks/usePlannerMutations';
import { useNow } from '../../hooks/useNow';
import { useTasks } from '../../hooks/useTasks';
import type { RepeatKind } from '../../models/Task';
import { formatDayHeading, formatTimeLabel, toDateKey } from '../../utils/date';
import { findOccurrence } from '../../utils/occurrences';
import { useAppDispatch } from '../../../store/hooks';
import { openEdit } from '../../../store/taskEditorSlice';
import { ConfirmDialog } from '../ConfirmDialog';
import { SeriesScopeDialog } from '../SeriesScopeDialog';
import { SubItemChecklist } from '../SubItemChecklist';

type PendingAction = 'delete' | 'deleteSeries' | 'endRepeat' | null;

const repeatLabel: Record<Exclude<RepeatKind, 'none'>, string> = {
  daily: 'Repeats every day',
  weekdays: 'Repeats on weekdays',
  weekly: 'Repeats weekly',
};

const TaskDetailDialog = () => {
  const { target, closeTaskDetail } = useTaskDetail();
  const dispatch = useAppDispatch();
  const { doc } = useTasks();
  const now = useNow();
  const today = toDateKey(now);
  const {
    setOccurrenceDone,
    setSubItemDone,
    deleteTask,
    deleteOccurrence,
    endRepeat,
    moveToToday,
  } = usePlannerMutations();
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);

  const occurrence = target
    ? findOccurrence(doc, target.taskId, target.date, today)
    : null;

  useEffect(() => {
    if (target && !occurrence) closeTaskDetail();
  }, [target, occurrence, closeTaskDetail]);

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      closeTaskDetail();
    } catch {
      setError("Couldn't save. Try again.");
    }
  };

  const isRepeating = occurrence !== null && occurrence.repeatKind !== 'none';

  return (
    <Dialog.Root
      open={occurrence !== null}
      onOpenChange={(open) => !open && closeTaskDetail()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-describedby={undefined}>
          {occurrence ? (
            <>
              <div className={styles.header}>
                <Dialog.Title className={styles.title}>
                  {occurrence.title}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="Close"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </Dialog.Close>
              </div>

              <p className={styles.when}>
                {formatDayHeading(occurrence.date)}
                {' · '}
                {occurrence.time ? formatTimeLabel(occurrence.time) : 'Anytime'}
                {isRepeating ? (
                  <span className={styles.repeat}>
                    <Repeat size={14} aria-hidden="true" />
                    {
                      repeatLabel[
                        occurrence.repeatKind as Exclude<RepeatKind, 'none'>
                      ]
                    }
                  </span>
                ) : null}
              </p>
              {occurrence.isOverdue ? (
                <p className={styles.overdue}>Overdue</p>
              ) : null}

              <SubItemChecklist
                subItems={occurrence.subItems}
                doneSubItemIds={occurrence.doneSubItemIds}
                onToggle={(subItemId, done) =>
                  setSubItemDone(
                    occurrence.taskId,
                    occurrence.date,
                    subItemId,
                    done,
                  )
                }
              />

              {error ? (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              ) : null}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() =>
                    setOccurrenceDone(
                      occurrence.taskId,
                      occurrence.date,
                      !occurrence.done,
                    )
                  }
                >
                  {occurrence.done ? 'Mark not done' : 'Mark done'}
                </button>
                {occurrence.isOverdue ? (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => {
                      moveToToday(occurrence.taskId);
                      closeTaskDetail();
                    }}
                  >
                    Move to today
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    closeTaskDetail();
                    dispatch(
                      openEdit({
                        taskId: occurrence.taskId,
                        date: occurrence.date,
                      }),
                    );
                  }}
                >
                  Edit
                </button>
                {isRepeating ? (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => setPending('endRepeat')}
                  >
                    End repeat
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() =>
                    setPending(isRepeating ? 'deleteSeries' : 'delete')
                  }
                >
                  Delete
                </button>
              </div>

              <ConfirmDialog
                open={pending === 'delete'}
                title="Delete this task?"
                description="This cannot be undone."
                confirmLabel="Delete"
                destructive
                onConfirm={() => {
                  setPending(null);
                  void run(() => deleteTask(occurrence.taskId));
                }}
                onCancel={() => setPending(null)}
              />
              <SeriesScopeDialog
                open={pending === 'deleteSeries'}
                onChoose={(scope) => {
                  setPending(null);
                  void run(() =>
                    deleteOccurrence(occurrence.taskId, occurrence.date, scope),
                  );
                }}
                onCancel={() => setPending(null)}
              />
              <ConfirmDialog
                open={pending === 'endRepeat'}
                title="Stop repeating?"
                description="Occurrences up to today stay; future ones are removed."
                confirmLabel="End repeat"
                onConfirm={() => {
                  setPending(null);
                  void run(() => endRepeat(occurrence.taskId));
                }}
                onCancel={() => setPending(null)}
              />
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default TaskDetailDialog;
