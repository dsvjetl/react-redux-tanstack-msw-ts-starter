import {
  addDays,
  differenceInCalendarDays,
  format,
  getISODay,
  isValid,
  parse,
} from 'date-fns';

import type { DateKey, TimeKey, Weekday } from '../models/Task';

const DATE_FORMAT = 'yyyy-MM-dd';
const TIME_FORMAT = 'HH:mm';

/** First hour row of the calendar grid (6 AM) and the number of rows (6–23). */
const GRID_FIRST_HOUR = 6;
const GRID_HOUR_COUNT = 18;

const toDateKey = (date: Date): DateKey => format(date, DATE_FORMAT);

const parseDateKey = (key: DateKey): Date => {
  const date = parse(key, DATE_FORMAT, new Date());
  if (!isValid(date)) {
    throw new RangeError(`Invalid date key: ${key}`);
  }
  return date;
};

const toTimeKey = (date: Date): TimeKey => format(date, TIME_FORMAT);

const parseTimeKey = (key: TimeKey): { hours: number; minutes: number } => ({
  hours: Number(key.slice(0, 2)),
  minutes: Number(key.slice(3, 5)),
});

const addDaysToKey = (key: DateKey, days: number): DateKey =>
  toDateKey(addDays(parseDateKey(key), days));

/** ISO date keys sort lexically, so plain comparison is correct. */
const compareDateKeys = (a: DateKey, b: DateKey): number =>
  a < b ? -1 : a > b ? 1 : 0;

const daysBetween = (from: DateKey, to: DateKey): number =>
  differenceInCalendarDays(parseDateKey(to), parseDateKey(from));

const isoWeekday = (key: DateKey): Weekday =>
  getISODay(parseDateKey(key)) as Weekday;

const weekDays = (start: DateKey): DateKey[] =>
  Array.from({ length: 7 }, (_, i) => addDaysToKey(start, i));

/** "Monday, Sep 22" */
const formatDayHeading = (key: DateKey): string =>
  format(parseDateKey(key), 'EEEE, MMM d');

/** "Mon 22" */
const formatColumnHeader = (key: DateKey): string =>
  format(parseDateKey(key), 'EEE d');

/** "22 – 28 Sep" within a month, "28 Sep – 4 Oct" across months. */
const formatRangeLabel = (start: DateKey, end: DateKey): string => {
  const a = parseDateKey(start);
  const b = parseDateKey(end);
  if (format(a, 'yyyy-MM') === format(b, 'yyyy-MM')) {
    return `${format(a, 'd')} – ${format(b, 'd MMM')}`;
  }
  return `${format(a, 'd MMM')} – ${format(b, 'd MMM')}`;
};

/** "8 AM", "2:30 PM" */
const formatTimeLabel = (time: TimeKey): string => {
  const { hours, minutes } = parseTimeKey(time);
  const date = new Date(2000, 0, 1, hours, minutes);
  return format(date, minutes === 0 ? 'h a' : 'h:mm a');
};

/** "6 AM" … "11 PM" for a grid row index 0..17 */
const formatHourRowLabel = (rowIndex: number): string =>
  format(new Date(2000, 0, 1, GRID_FIRST_HOUR + rowIndex), 'h a');

/** Row index 0..17 for the calendar grid, clamped. */
const hourRowIndex = (time: TimeKey): number => {
  const { hours } = parseTimeKey(time);
  return Math.min(Math.max(hours - GRID_FIRST_HOUR, 0), GRID_HOUR_COUNT - 1);
};

export {
  GRID_HOUR_COUNT,
  addDaysToKey,
  compareDateKeys,
  daysBetween,
  formatColumnHeader,
  formatDayHeading,
  formatHourRowLabel,
  formatRangeLabel,
  formatTimeLabel,
  hourRowIndex,
  isoWeekday,
  parseDateKey,
  toDateKey,
  toTimeKey,
  weekDays,
};
