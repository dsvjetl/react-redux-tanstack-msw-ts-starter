import type { PlannerDocument } from '../models/PlannerDocument';
import type { DateKey, RepeatRule, Task } from '../models/Task';
import { type Occurrence, emptyOccurrenceState } from '../models/Occurrence';
import { makeOccurrenceKey } from './occurrenceKey';
import { addDaysToKey, daysBetween, isoWeekday } from './date';

/** Longest range the expansion accepts, in days. */
const MAX_RANGE_DAYS = 366;

const ruleMatchesDay = (rule: RepeatRule, date: DateKey): boolean => {
  switch (rule.kind) {
    case 'none':
      return true;
    case 'daily':
      return true;
    case 'weekdays':
      return isoWeekday(date) <= 5;
    case 'weekly':
      return rule.days.includes(isoWeekday(date));
  }
};

/** Does this task produce an occurrence on `date`? Ignores overrides. */
const matchesRule = (
  task: Pick<Task, 'startDate' | 'endDate' | 'repeat'>,
  date: DateKey,
): boolean => {
  if (task.repeat.kind === 'none') {
    return date === task.startDate;
  }
  if (date < task.startDate) return false;
  if (task.endDate !== null && date > task.endDate) return false;
  return ruleMatchesDay(task.repeat, date);
};

const max = (a: DateKey, b: DateKey) => (a > b ? a : b);
const min = (a: DateKey, b: DateKey) => (a < b ? a : b);

const buildOccurrence = (
  doc: PlannerDocument,
  task: Task,
  date: DateKey,
  today: DateKey,
): Occurrence | null => {
  const key = makeOccurrenceKey(task.id, date);
  const override = doc.overrides[key];
  if (override?.deleted) return null;
  const state = doc.occurrenceStates[key] ?? emptyOccurrenceState();
  const done = state.done;
  return {
    key,
    taskId: task.id,
    date,
    title: override?.title ?? task.title,
    time: override?.time !== undefined ? override.time : task.time,
    subItems: override?.subItems ?? task.subItems,
    repeatKind: task.repeat.kind,
    done,
    doneSubItemIds: state.doneSubItemIds,
    isOverdue: task.repeat.kind === 'none' && date < today && !done,
    createdAt: task.createdAt,
  };
};

/**
 * Expand every task into its occurrences between `from` and `to` (inclusive).
 * Overrides are applied; deleted occurrences are skipped; states attached.
 */
const occurrencesInRange = (
  doc: PlannerDocument,
  from: DateKey,
  to: DateKey,
  today: DateKey = from,
): Occurrence[] => {
  if (to < from) return [];
  if (daysBetween(from, to) > MAX_RANGE_DAYS) {
    throw new RangeError(
      `Occurrence range must not exceed ${MAX_RANGE_DAYS} days`,
    );
  }

  const result: Occurrence[] = [];

  for (const task of doc.tasks) {
    if (task.repeat.kind === 'none') {
      if (task.startDate >= from && task.startDate <= to) {
        const occurrence = buildOccurrence(doc, task, task.startDate, today);
        if (occurrence) result.push(occurrence);
      }
      continue;
    }

    const lo = max(task.startDate, from);
    const hi = task.endDate === null ? to : min(task.endDate, to);
    for (let day = lo; day <= hi; day = addDaysToKey(day, 1)) {
      if (!ruleMatchesDay(task.repeat, day)) continue;
      const occurrence = buildOccurrence(doc, task, day, today);
      if (occurrence) result.push(occurrence);
    }
  }

  return sortOccurrences(result);
};

/** The effective occurrence of one task on one day, or null if none. */
const findOccurrence = (
  doc: PlannerDocument,
  taskId: string,
  date: DateKey,
  today: DateKey = date,
): Occurrence | null => {
  const task = doc.tasks.find((t) => t.id === taskId);
  if (!task || !matchesRule(task, date)) return null;
  return buildOccurrence(doc, task, date, today);
};

/** Date asc, then timed before anytime, then time asc, then creation order. */
const sortOccurrences = (occurrences: Occurrence[]): Occurrence[] =>
  [...occurrences].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.time === null && b.time !== null) return 1;
    if (a.time !== null && b.time === null) return -1;
    if (a.time !== null && b.time !== null && a.time !== b.time) {
      return a.time < b.time ? -1 : 1;
    }
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return a.taskId < b.taskId ? -1 : a.taskId > b.taskId ? 1 : 0;
  });

export { findOccurrence, matchesRule, occurrencesInRange, sortOccurrences };
