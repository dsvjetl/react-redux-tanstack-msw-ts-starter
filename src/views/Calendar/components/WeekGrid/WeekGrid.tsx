import { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';

import styles from './WeekGrid.module.scss';
import type { Occurrence } from '../../../../shared/models/Occurrence';
import type { DateKey } from '../../../../shared/models/Task';
import {
  GRID_HOUR_COUNT,
  formatColumnHeader,
  formatDayHeading,
  formatHourRowLabel,
  hourRowIndex,
} from '../../../../shared/utils/date';
import { AnytimeRow } from '../AnytimeRow';
import { OccurrenceBlock } from '../OccurrenceBlock';
import type { DayOccurrences } from '../../hooks/useWeekOccurrences';

interface WeekGridProps {
  days: DateKey[];
  byDay: Record<DateKey, DayOccurrences>;
  isToday: (date: DateKey) => boolean;
  onOpen: (occurrence: Occurrence) => void;
  onAddOn: (date: DateKey) => void;
}

const hourRows = Array.from({ length: GRID_HOUR_COUNT }, (_, i) => i);

const WeekGrid = ({ days, byDay, isToday, onOpen, onAddOn }: WeekGridProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cornerRef = useRef<HTMLDivElement | null>(null);
  const todayHeaderRef = useRef<HTMLDivElement | null>(null);

  // Bring today's column to the left edge, just right of the sticky time column.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const header = todayHeaderRef.current;
    if (!scroller || !header) return;
    const timeColumnWidth =
      cornerRef.current?.getBoundingClientRect().width ?? 0;
    const delta =
      header.getBoundingClientRect().left -
      scroller.getBoundingClientRect().left -
      timeColumnWidth;
    scroller.scrollTo({ left: Math.max(0, scroller.scrollLeft + delta) });
  }, [days]);

  return (
    <div className={styles.scroller} ref={scrollerRef}>
      <div role="table" aria-label="Week schedule" className={styles.grid}>
        <div role="row" className={styles.headerRow}>
          <div role="columnheader" className={styles.corner} ref={cornerRef}>
            <span className={styles.visuallyHidden}>Time</span>
          </div>
          {days.map((day) => {
            const today = isToday(day);
            return (
              <div
                key={day}
                role="columnheader"
                ref={today ? todayHeaderRef : undefined}
                aria-current={today ? 'date' : undefined}
                className={today ? styles.dayHeaderToday : styles.dayHeader}
              >
                <span>{formatColumnHeader(day)}</span>
                <button
                  type="button"
                  className={styles.addButton}
                  aria-label={`Add task on ${formatDayHeading(day)}`}
                  onClick={() => onAddOn(day)}
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>

        <AnytimeRow
          days={days}
          byDay={byDay}
          isToday={isToday}
          onOpen={onOpen}
        />

        {hourRows.map((rowIndex) => (
          <div role="row" key={rowIndex} className={styles.row}>
            <div role="rowheader" className={styles.rowHeader}>
              {formatHourRowLabel(rowIndex)}
            </div>
            {days.map((day) => {
              const blocks = byDay[day]?.timed.filter(
                (occurrence) =>
                  occurrence.time !== null &&
                  hourRowIndex(occurrence.time) === rowIndex,
              );
              return (
                <div
                  key={day}
                  role="cell"
                  className={isToday(day) ? styles.cellToday : styles.cell}
                >
                  {blocks?.map((occurrence) => (
                    <OccurrenceBlock
                      key={occurrence.key}
                      occurrence={occurrence}
                      onOpen={onOpen}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekGrid;
