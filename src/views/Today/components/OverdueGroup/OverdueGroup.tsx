import styles from './OverdueGroup.module.scss';
import type { Occurrence } from '../../../../shared/models/Occurrence';
import { TaskCard } from '../../../../shared/components/TaskCard';
import {
  formatDayHeading,
  formatTimeLabel,
} from '../../../../shared/utils/date';

interface OverdueGroupProps {
  occurrences: Occurrence[];
  onToggleDone: (occurrence: Occurrence, done: boolean) => void;
  onToggleSubItem: (
    occurrence: Occurrence,
    subItemId: string,
    done: boolean,
  ) => void;
  onMoveToToday: (occurrence: Occurrence) => void;
  onOpen?: (occurrence: Occurrence) => void;
}

const OverdueGroup = ({
  occurrences,
  onToggleDone,
  onToggleSubItem,
  onMoveToToday,
  onOpen,
}: OverdueGroupProps) => {
  if (occurrences.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Overdue">
      <h2 className={styles.heading}>Overdue</h2>
      <ul className={styles.list}>
        {occurrences.map((occurrence) => (
          <li key={occurrence.key}>
            <TaskCard
              occurrence={occurrence}
              variant="overdue"
              meta={
                <span>
                  {formatDayHeading(occurrence.date)}
                  {occurrence.time
                    ? ` · ${formatTimeLabel(occurrence.time)}`
                    : ''}
                </span>
              }
              actions={
                <button
                  type="button"
                  className={styles.move}
                  onClick={() => onMoveToToday(occurrence)}
                >
                  Move to today
                </button>
              }
              onToggleDone={(done) => onToggleDone(occurrence, done)}
              onToggleSubItem={(id, done) =>
                onToggleSubItem(occurrence, id, done)
              }
              onOpen={onOpen ? () => onOpen(occurrence) : undefined}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default OverdueGroup;
