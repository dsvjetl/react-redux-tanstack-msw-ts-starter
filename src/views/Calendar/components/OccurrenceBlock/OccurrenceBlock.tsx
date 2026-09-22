import { Repeat } from 'lucide-react';

import styles from './OccurrenceBlock.module.scss';
import type { Occurrence } from '../../../../shared/models/Occurrence';
import type { RepeatKind } from '../../../../shared/models/Task';
import { formatTimeLabel } from '../../../../shared/utils/date';

interface OccurrenceBlockProps {
  occurrence: Occurrence;
  onOpen: (occurrence: Occurrence) => void;
}

const repeatLabel: Record<Exclude<RepeatKind, 'none'>, string> = {
  daily: 'repeats every day',
  weekdays: 'repeats on weekdays',
  weekly: 'repeats weekly',
};

const accessibleName = (occurrence: Occurrence) => {
  const parts = [
    occurrence.title,
    occurrence.time ? formatTimeLabel(occurrence.time) : 'Anytime',
  ];
  const count = occurrence.subItems.length;
  if (count > 0)
    parts.push(`${count} ${count === 1 ? 'sub-item' : 'sub-items'}`);
  if (occurrence.repeatKind !== 'none')
    parts.push(repeatLabel[occurrence.repeatKind]);
  return parts.join(', ');
};

const OccurrenceBlock = ({ occurrence, onOpen }: OccurrenceBlockProps) => {
  const count = occurrence.subItems.length;

  return (
    <button
      type="button"
      className={occurrence.done ? styles.blockDone : styles.block}
      aria-label={accessibleName(occurrence)}
      onClick={() => onOpen(occurrence)}
    >
      <span className={styles.title}>{occurrence.title}</span>
      <span className={styles.footer}>
        {occurrence.repeatKind !== 'none' ? (
          <Repeat size={12} className={styles.repeat} aria-hidden="true" />
        ) : null}
        {count > 0 ? <span className={styles.badge}>{count}</span> : null}
      </span>
    </button>
  );
};

export default OccurrenceBlock;
