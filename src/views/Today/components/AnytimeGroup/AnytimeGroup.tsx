import styles from './AnytimeGroup.module.scss';
import type { Occurrence } from '../../../../shared/models/Occurrence';
import { TaskCard } from '../../../../shared/components/TaskCard';

interface AnytimeGroupProps {
  occurrences: Occurrence[];
  onToggleDone: (occurrence: Occurrence, done: boolean) => void;
  onToggleSubItem: (
    occurrence: Occurrence,
    subItemId: string,
    done: boolean,
  ) => void;
  onOpen?: (occurrence: Occurrence) => void;
}

const AnytimeGroup = ({
  occurrences,
  onToggleDone,
  onToggleSubItem,
  onOpen,
}: AnytimeGroupProps) => {
  if (occurrences.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Anytime</h2>
      <ul className={styles.list} aria-label="Anytime">
        {occurrences.map((occurrence) => (
          <li key={occurrence.key}>
            <TaskCard
              occurrence={occurrence}
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

export default AnytimeGroup;
