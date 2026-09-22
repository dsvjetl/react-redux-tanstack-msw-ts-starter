import type { PlannerDocument } from '../models/PlannerDocument';
import type { OccurrenceOverride, OccurrenceState } from '../models/Occurrence';
import {
  type DateKey,
  type OccurrenceInput,
  type SubItem,
  type Task,
  type TaskInput,
  isRepeating,
  occurrenceInputSchema,
  taskInputSchema,
} from '../models/Task';
import { makeOccurrenceKey, parseOccurrenceKey } from './occurrenceKey';
import { matchesRule } from './occurrences';
import { addDaysToKey, toDateKey } from './date';

export type SeriesScope = 'this' | 'future';

export type PlannerCommand =
  | { type: 'createTask'; input: TaskInput }
  | { type: 'updateTask'; taskId: string; input: TaskInput }
  | {
      type: 'updateOccurrence';
      taskId: string;
      date: DateKey;
      scope: SeriesScope;
      input: OccurrenceInput;
    }
  | { type: 'deleteTask'; taskId: string }
  | {
      type: 'deleteOccurrence';
      taskId: string;
      date: DateKey;
      scope: SeriesScope;
    }
  | { type: 'endRepeat'; taskId: string }
  | { type: 'setOccurrenceDone'; taskId: string; date: DateKey; done: boolean }
  | {
      type: 'setSubItemDone';
      taskId: string;
      date: DateKey;
      subItemId: string;
      done: boolean;
    }
  | { type: 'moveToToday'; taskId: string };

export interface CommandContext {
  now: Date;
  newId: () => string;
}

type PlannerCommandErrorCode =
  | 'TASK_NOT_FOUND'
  | 'SCOPE_NOT_ALLOWED'
  | 'INVALID_INPUT';

export class PlannerCommandError extends Error {
  readonly code: PlannerCommandErrorCode;

  constructor(code: PlannerCommandErrorCode, message: string) {
    super(message);
    this.name = 'PlannerCommandError';
    this.code = code;
  }
}

// ---------- helpers ----------

const cloneDocument = (doc: PlannerDocument): PlannerDocument =>
  structuredClone(doc);

const findTask = (doc: PlannerDocument, taskId: string): Task => {
  const task = doc.tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new PlannerCommandError('TASK_NOT_FOUND', `No task ${taskId}`);
  }
  return task;
};

const requireOneOff = (task: Task) => {
  if (isRepeating(task)) {
    throw new PlannerCommandError(
      'SCOPE_NOT_ALLOWED',
      'This command applies to one-off tasks only',
    );
  }
};

const requireRepeating = (task: Task) => {
  if (!isRepeating(task)) {
    throw new PlannerCommandError(
      'SCOPE_NOT_ALLOWED',
      'This command applies to repeating tasks only',
    );
  }
};

const requireOccurrence = (doc: PlannerDocument, task: Task, date: DateKey) => {
  const key = makeOccurrenceKey(task.id, date);
  if (!matchesRule(task, date) || doc.overrides[key]?.deleted) {
    throw new PlannerCommandError(
      'TASK_NOT_FOUND',
      `Task ${task.id} has no occurrence on ${date}`,
    );
  }
  return key;
};

const parseInput = <T>(
  schema: {
    safeParse: (v: unknown) => {
      success: boolean;
      data?: T;
      error?: { message: string };
    };
  },
  value: unknown,
): T => {
  const result = schema.safeParse(value);
  if (!result.success || result.data === undefined) {
    throw new PlannerCommandError(
      'INVALID_INPUT',
      result.error?.message ?? 'Invalid input',
    );
  }
  return result.data;
};

const withIds = (
  items: Array<{ id?: string; text: string }>,
  newId: () => string,
): SubItem[] =>
  items.map((item) => ({ id: item.id ?? newId(), text: item.text }));

const removeEntries = (
  record: Record<string, unknown>,
  taskId: string,
  predicate: (date: DateKey) => boolean,
) => {
  for (const key of Object.keys(record)) {
    const parsed = parseOccurrenceKey(key);
    if (parsed && parsed.taskId === taskId && predicate(parsed.date)) {
      delete record[key];
    }
  }
};

const rekeyEntries = <T>(
  record: Record<string, T>,
  fromTaskId: string,
  toTaskId: string,
  predicate: (date: DateKey) => boolean,
) => {
  for (const key of Object.keys(record)) {
    const parsed = parseOccurrenceKey(key);
    if (parsed && parsed.taskId === fromTaskId && predicate(parsed.date)) {
      const value = record[key];
      delete record[key];
      record[makeOccurrenceKey(toTaskId, parsed.date)] = value;
    }
  }
};

const setState = (
  doc: PlannerDocument,
  key: string,
  update: (state: OccurrenceState) => OccurrenceState,
) => {
  const current = doc.occurrenceStates[key] ?? {
    done: false,
    doneSubItemIds: [],
  };
  const next = update(current);
  if (!next.done && next.doneSubItemIds.length === 0) {
    delete doc.occurrenceStates[key];
  } else {
    doc.occurrenceStates[key] = next;
  }
};

const removeTask = (doc: PlannerDocument, taskId: string) => {
  doc.tasks = doc.tasks.filter((t) => t.id !== taskId);
  removeEntries(doc.occurrenceStates, taskId, () => true);
  removeEntries(doc.overrides, taskId, () => true);
};

// ---------- commands ----------

const createTask = (
  doc: PlannerDocument,
  input: TaskInput,
  ctx: CommandContext,
) => {
  const valid = parseInput<TaskInput>(taskInputSchema, input);
  const stamp = ctx.now.toISOString();
  doc.tasks.push({
    id: ctx.newId(),
    title: valid.title,
    startDate: valid.startDate,
    time: valid.time,
    repeat: valid.repeat,
    endDate: null,
    subItems: withIds(valid.subItems, ctx.newId),
    createdAt: stamp,
    updatedAt: stamp,
  });
};

const updateTask = (
  doc: PlannerDocument,
  taskId: string,
  input: TaskInput,
  ctx: CommandContext,
) => {
  const task = findTask(doc, taskId);
  requireOneOff(task);
  const valid = parseInput<TaskInput>(taskInputSchema, input);
  const previousDate = task.startDate;

  task.title = valid.title;
  task.startDate = valid.startDate;
  task.time = valid.time;
  task.repeat = valid.repeat;
  task.subItems = withIds(valid.subItems, ctx.newId);
  task.updatedAt = ctx.now.toISOString();

  if (previousDate !== task.startDate) {
    const oldKey = makeOccurrenceKey(task.id, previousDate);
    const state = doc.occurrenceStates[oldKey];
    delete doc.occurrenceStates[oldKey];
    if (state && task.repeat.kind === 'none') {
      doc.occurrenceStates[makeOccurrenceKey(task.id, task.startDate)] = state;
    }
  }
  pruneSubItemStates(doc, task);
};

const pruneSubItemStates = (doc: PlannerDocument, task: Task) => {
  for (const [key, state] of Object.entries(doc.occurrenceStates)) {
    const parsed = parseOccurrenceKey(key);
    if (!parsed || parsed.taskId !== task.id) continue;
    const subItems = doc.overrides[key]?.subItems ?? task.subItems;
    const known = new Set(subItems.map((s) => s.id));
    setState(doc, key, () => ({
      done: state.done,
      doneSubItemIds: state.doneSubItemIds.filter((id) => known.has(id)),
    }));
  }
};

const updateOccurrence = (
  doc: PlannerDocument,
  taskId: string,
  date: DateKey,
  scope: SeriesScope,
  input: OccurrenceInput,
  ctx: CommandContext,
) => {
  const task = findTask(doc, taskId);
  requireRepeating(task);
  const key = requireOccurrence(doc, task, date);
  const valid = parseInput<OccurrenceInput>(occurrenceInputSchema, input);
  const subItems = withIds(valid.subItems, ctx.newId);
  const stamp = ctx.now.toISOString();

  if (scope === 'this') {
    const override: OccurrenceOverride = {
      title: valid.title,
      time: valid.time,
      subItems,
    };
    doc.overrides[key] = override;
    task.updatedAt = stamp;
    pruneSubItemStates(doc, task);
    return;
  }

  // scope === 'future'
  delete doc.overrides[key];
  const repeat = valid.repeat ?? task.repeat;

  if (date === task.startDate) {
    task.title = valid.title;
    task.time = valid.time;
    task.subItems = subItems;
    task.repeat = repeat;
    if (repeat.kind === 'none') {
      task.endDate = null;
      removeEntries(doc.occurrenceStates, task.id, (d) => d !== date);
      removeEntries(doc.overrides, task.id, () => true);
    }
    task.updatedAt = stamp;
    pruneSubItemStates(doc, task);
    return;
  }

  const newTask: Task = {
    id: ctx.newId(),
    title: valid.title,
    startDate: date,
    time: valid.time,
    repeat,
    endDate: repeat.kind === 'none' ? null : task.endDate,
    subItems,
    createdAt: task.createdAt,
    updatedAt: stamp,
  };
  task.endDate = addDaysToKey(date, -1);
  task.updatedAt = stamp;

  rekeyEntries(doc.occurrenceStates, task.id, newTask.id, (d) => d >= date);
  rekeyEntries(doc.overrides, task.id, newTask.id, (d) => d >= date);
  if (repeat.kind === 'none') {
    removeEntries(doc.occurrenceStates, newTask.id, (d) => d !== date);
    removeEntries(doc.overrides, newTask.id, () => true);
  }
  doc.tasks.push(newTask);
  pruneSubItemStates(doc, newTask);
};

const deleteTask = (doc: PlannerDocument, taskId: string) => {
  const task = findTask(doc, taskId);
  requireOneOff(task);
  removeTask(doc, taskId);
};

const deleteOccurrence = (
  doc: PlannerDocument,
  taskId: string,
  date: DateKey,
  scope: SeriesScope,
  ctx: CommandContext,
) => {
  const task = findTask(doc, taskId);
  requireRepeating(task);
  const key = requireOccurrence(doc, task, date);

  if (scope === 'this') {
    doc.overrides[key] = { deleted: true };
    delete doc.occurrenceStates[key];
    task.updatedAt = ctx.now.toISOString();
    return;
  }

  if (date <= task.startDate) {
    removeTask(doc, taskId);
    return;
  }
  task.endDate = addDaysToKey(date, -1);
  task.updatedAt = ctx.now.toISOString();
  removeEntries(doc.occurrenceStates, taskId, (d) => d >= date);
  removeEntries(doc.overrides, taskId, (d) => d >= date);
};

const endRepeat = (
  doc: PlannerDocument,
  taskId: string,
  ctx: CommandContext,
) => {
  const task = findTask(doc, taskId);
  requireRepeating(task);
  const today = toDateKey(ctx.now);
  if (task.startDate > today) {
    removeTask(doc, taskId);
    return;
  }
  task.endDate =
    task.endDate !== null && task.endDate < today ? task.endDate : today;
  task.updatedAt = ctx.now.toISOString();
  removeEntries(doc.occurrenceStates, taskId, (d) => d > today);
  removeEntries(doc.overrides, taskId, (d) => d > today);
};

const setOccurrenceDone = (
  doc: PlannerDocument,
  taskId: string,
  date: DateKey,
  done: boolean,
) => {
  const task = findTask(doc, taskId);
  const key = requireOccurrence(doc, task, date);
  setState(doc, key, (state) => ({ ...state, done }));
};

const setSubItemDone = (
  doc: PlannerDocument,
  taskId: string,
  date: DateKey,
  subItemId: string,
  done: boolean,
) => {
  const task = findTask(doc, taskId);
  const key = requireOccurrence(doc, task, date);
  const subItems = doc.overrides[key]?.subItems ?? task.subItems;
  if (!subItems.some((s) => s.id === subItemId)) {
    throw new PlannerCommandError(
      'INVALID_INPUT',
      `No sub-item ${subItemId} on ${key}`,
    );
  }
  setState(doc, key, (state) => ({
    ...state,
    doneSubItemIds: done
      ? Array.from(new Set([...state.doneSubItemIds, subItemId]))
      : state.doneSubItemIds.filter((id) => id !== subItemId),
  }));
};

const moveToToday = (
  doc: PlannerDocument,
  taskId: string,
  ctx: CommandContext,
) => {
  const task = findTask(doc, taskId);
  requireOneOff(task);
  const today = toDateKey(ctx.now);
  if (task.startDate === today) return;
  const oldKey = makeOccurrenceKey(task.id, task.startDate);
  const state = doc.occurrenceStates[oldKey];
  delete doc.occurrenceStates[oldKey];
  task.startDate = today;
  task.updatedAt = ctx.now.toISOString();
  if (state) doc.occurrenceStates[makeOccurrenceKey(task.id, today)] = state;
};

/** Pure: never mutates `doc`; returns the next document. */
export const applyCommand = (
  doc: PlannerDocument,
  cmd: PlannerCommand,
  ctx: CommandContext,
): PlannerDocument => {
  const next = cloneDocument(doc);
  switch (cmd.type) {
    case 'createTask':
      createTask(next, cmd.input, ctx);
      break;
    case 'updateTask':
      updateTask(next, cmd.taskId, cmd.input, ctx);
      break;
    case 'updateOccurrence':
      updateOccurrence(next, cmd.taskId, cmd.date, cmd.scope, cmd.input, ctx);
      break;
    case 'deleteTask':
      deleteTask(next, cmd.taskId);
      break;
    case 'deleteOccurrence':
      deleteOccurrence(next, cmd.taskId, cmd.date, cmd.scope, ctx);
      break;
    case 'endRepeat':
      endRepeat(next, cmd.taskId, ctx);
      break;
    case 'setOccurrenceDone':
      setOccurrenceDone(next, cmd.taskId, cmd.date, cmd.done);
      break;
    case 'setSubItemDone':
      setSubItemDone(next, cmd.taskId, cmd.date, cmd.subItemId, cmd.done);
      break;
    case 'moveToToday':
      moveToToday(next, cmd.taskId, ctx);
      break;
  }
  return next;
};
