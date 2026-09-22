import styles from './AnytimeRow.module.scss';
import type { Occurrence } from '../../../../shared/models/Occurrence';
import type { DateKey } from '../../../../shared/models/Task';
import { OccurrenceBlock } from '../OccurrenceBlock';

interface AnytimeRowProps {
  days: DateKey[];
  byDay: Record<DateKey, { anytime: Occurrence[] }>;
  isToday: (date: DateKey) => boolean;
  onOpen: (occurrence: Occurrence) => void;
}

const AnytimeRow = ({ days, byDay, isToday, onOpen }: AnytimeRowProps) => {
  return (
    <div role="row" className={styles.row}>
      <div role="rowheader" className={styles.rowHeader}>
        Anytime
      </div>
      {days.map((day) => (
        <div
          key={day}
          role="cell"
          className={isToday(day) ? styles.cellToday : styles.cell}
        >
          {byDay[day]?.anytime.map((occurrence) => (
            <OccurrenceBlock
              key={occurrence.key}
              occurrence={occurrence}
              onOpen={onOpen}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default AnytimeRow;
