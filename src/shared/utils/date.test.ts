import {
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
} from './date';

describe('date keys', () => {
  it('converts to and from local date keys', () => {
    const date = new Date(2026, 8, 22, 14, 30);
    expect(toDateKey(date)).toBe('2026-09-22');
    expect(toTimeKey(date)).toBe('14:30');
    expect(parseDateKey('2026-09-22').getDate()).toBe(22);
  });

  it('adds days across month boundaries', () => {
    expect(addDaysToKey('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDaysToKey('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('compares and measures keys', () => {
    expect(compareDateKeys('2026-09-21', '2026-09-22')).toBe(-1);
    expect(daysBetween('2026-09-22', '2026-09-28')).toBe(6);
  });

  it('knows ISO weekdays (Monday = 1)', () => {
    expect(isoWeekday('2026-09-21')).toBe(1);
    expect(isoWeekday('2026-09-27')).toBe(7);
  });

  it('builds a 7-day week', () => {
    expect(weekDays('2026-09-22')).toHaveLength(7);
    expect(weekDays('2026-09-22')[6]).toBe('2026-09-28');
  });
});

describe('formatting', () => {
  it('formats the reference labels', () => {
    expect(formatDayHeading('2026-09-22')).toBe('Tuesday, Sep 22');
    expect(formatColumnHeader('2026-09-22')).toBe('Tue 22');
    expect(formatRangeLabel('2026-09-22', '2026-09-28')).toBe('22 – 28 Sep');
    expect(formatRangeLabel('2026-09-28', '2026-10-04')).toBe('28 Sep – 4 Oct');
  });

  it('formats times', () => {
    expect(formatTimeLabel('08:00')).toBe('8 AM');
    expect(formatTimeLabel('14:30')).toBe('2:30 PM');
    expect(formatTimeLabel('00:00')).toBe('12 AM');
    expect(formatHourRowLabel(0)).toBe('6 AM');
    expect(formatHourRowLabel(17)).toBe('11 PM');
  });
});

describe('hourRowIndex', () => {
  it('maps 6 AM to row 0 and clamps outside the grid', () => {
    expect(hourRowIndex('06:00')).toBe(0);
    expect(hourRowIndex('14:30')).toBe(8);
    expect(hourRowIndex('23:30')).toBe(17);
    expect(hourRowIndex('03:00')).toBe(0);
  });
});
