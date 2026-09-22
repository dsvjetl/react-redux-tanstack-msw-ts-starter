import { ChevronLeft, ChevronRight } from 'lucide-react';

import styles from './WeekHeader.module.scss';

interface WeekHeaderProps {
  rangeLabel: string;
  isCurrentWeek: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onThisWeek: () => void;
}

const WeekHeader = ({
  rangeLabel,
  isCurrentWeek,
  onPrevious,
  onNext,
  onThisWeek,
}: WeekHeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.heading}>Schedule</h1>
        <span className={styles.chip} role="status" aria-live="polite">
          {rangeLabel}
        </span>
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Previous week"
          onClick={onPrevious}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.textButton}
          onClick={onThisWeek}
          disabled={isCurrentWeek}
        >
          This week
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Next week"
          onClick={onNext}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

export default WeekHeader;
