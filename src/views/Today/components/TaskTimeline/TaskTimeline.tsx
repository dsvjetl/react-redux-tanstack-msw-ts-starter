import styles from './TaskTimeline.module.scss';
import type { Occurrence } from '../../../../shared/models/Occurrence';
import { TaskCard } from '../../../../shared/components/TaskCard';
import { formatTimeLabel } from '../../../../shared/utils/date';

interface TaskTimelineProps {
  occurrences: Occurrence[];
  upNextKey?: string | null;
  onToggleDone: (occurrence: Occurrence, done: boolean) => void;
  onToggleSubItem: (
    occurrence: Occurrence,
    subItemId: string,
    done: boolean,
  ) => void;
  onOpen?: (occurrence: Occurrence) => void;
}

const TaskTimeline = ({
  occurrences,
  upNextKey = null,
  onToggleDone,
  onToggleSubItem,
  onOpen,
}: TaskTimelineProps) => {
  if (occurrences.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Today&apos;s schedule</h2>
      <ul className={styles.list} aria-label="Today's schedule">
        {occurrences.map((occurrence) => {
          const isUpNext = occurrence.key === upNextKey;
          return (
            <li key={occurrence.key} className={styles.item}>
              <div className={styles.rail}>
                <span
                  className={isUpNext ? styles.timeActive : styles.time}
                  aria-hidden="true"
                >
                  {occurrence.time ? formatTimeLabel(occurrence.time) : ''}
                </span>
              </div>
              <div className={styles.cardSlot}>
                <TaskCard
                  occurrence={occurrence}
                  variant={isUpNext ? 'upNext' : 'default'}
                  onToggleDone={(done) => onToggleDone(occurrence, done)}
                  onToggleSubItem={(id, done) =>
                    onToggleSubItem(occurrence, id, done)
                  }
                  onOpen={onOpen ? () => onOpen(occurrence) : undefined}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default TaskTimeline;
