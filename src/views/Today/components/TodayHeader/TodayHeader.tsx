import styles from './TodayHeader.module.scss';
import { formatDayHeading } from '../../../../shared/utils/date';

interface TodayHeaderProps {
  today: string;
  remainingCount: number;
}

const TodayHeader = ({ today, remainingCount }: TodayHeaderProps) => {
  const noun = remainingCount === 1 ? 'task' : 'tasks';

  return (
    <header className={styles.header}>
      <h1 className={styles.heading}>{formatDayHeading(today)}</h1>
      <span
        className={styles.badge}
        role="status"
        aria-live="polite"
        aria-label={`${remainingCount} ${noun} remaining`}
      >
        {remainingCount}
      </span>
    </header>
  );
};

export default TodayHeader;
