import type { DateKey } from '../models/Task';
import type { OccurrenceKey } from '../models/Occurrence';

const SEPARATOR = ':';

const makeOccurrenceKey = (taskId: string, date: DateKey): OccurrenceKey =>
  `${taskId}${SEPARATOR}${date}`;

const parseOccurrenceKey = (
  key: OccurrenceKey,
): { taskId: string; date: DateKey } | null => {
  const index = key.lastIndexOf(SEPARATOR);
  if (index <= 0 || index === key.length - 1) {
    return null;
  }
  return { taskId: key.slice(0, index), date: key.slice(index + 1) };
};

export { makeOccurrenceKey, parseOccurrenceKey };
