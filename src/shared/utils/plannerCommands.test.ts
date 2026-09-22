import type { PlannerDocument } from '../models/PlannerDocument';
import { emptyDocument } from '../models/PlannerDocument';
import type { Task, TaskInput } from '../models/Task';
import { makeOccurrenceKey } from './occurrenceKey';
import { occurrencesInRange } from './occurrences';
import {
  type CommandContext,
  PlannerCommandError,
  applyCommand,
} from './plannerCommands';

const makeCtx = (start = 0): CommandContext => {
  let n = start;
  return { now: new Date(2026, 8, 22, 14, 0), newId: () => `id-${++n}` };
};

const input = (overrides: Partial<TaskInput> = {}): TaskInput => ({
  title: 'Brush your teeth',
  startDate: '2026-09-20',
  time: '08:00',
  repeat: { kind: 'daily' },
  subItems: [{ text: 'top' }, { text: 'bottom' }],
  ...overrides,
});

const seeded = (taskInput: TaskInput = input()) =>
  applyCommand(
    emptyDocument(),
    { type: 'createTask', input: taskInput },
    makeCtx(),
  );

const findTask = (doc: PlannerDocument, id: string): Task =>
  doc.tasks.find((t) => t.id === id) as Task;

describe('createTask', () => {
  it('appends a validated task with generated ids and timestamps', () => {
    const doc = seeded();
    expect(doc.tasks).toHaveLength(1);
    const task = doc.tasks[0];
    expect(task.id).toBe('id-1');
    expect(task.subItems.map((s) => s.id)).toEqual(['id-2', 'id-3']);
    expect(task.endDate).toBeNull();
    expect(task.createdAt).toBe(task.updatedAt);
  });

  it('does not mutate the input document', () => {
    const before = emptyDocument();
    applyCommand(before, { type: 'createTask', input: input() }, makeCtx());
    expect(before.tasks).toEqual([]);
  });

  it('rejects invalid input', () => {
    expect(() =>
      applyCommand(
        emptyDocument(),
        { type: 'createTask', input: input({ title: '' }) },
        makeCtx(),
      ),
    ).toThrow(PlannerCommandError);
  });
});

describe('updateTask (one-off)', () => {
  it('replaces fields and re-keys state when the date changes', () => {
    let doc = seeded(
      input({ repeat: { kind: 'none' }, startDate: '2026-09-22' }),
    );
    doc = applyCommand(
      doc,
      {
        type: 'setOccurrenceDone',
        taskId: 'id-1',
        date: '2026-09-22',
        done: true,
      },
      makeCtx(),
    );
    doc = applyCommand(
      doc,
      {
        type: 'updateTask',
        taskId: 'id-1',
        input: input({
          repeat: { kind: 'none' },
          startDate: '2026-09-25',
          title: 'Moved',
        }),
      },
      makeCtx(),
    );
    expect(findTask(doc, 'id-1').title).toBe('Moved');
    expect(
      doc.occurrenceStates[makeOccurrenceKey('id-1', '2026-09-25')]?.done,
    ).toBe(true);
    expect(
      doc.occurrenceStates[makeOccurrenceKey('id-1', '2026-09-22')],
    ).toBeUndefined();
  });

  it('refuses to run on a repeating task', () => {
    const doc = seeded();
    expect(() =>
      applyCommand(
        doc,
        { type: 'updateTask', taskId: 'id-1', input: input() },
        makeCtx(),
      ),
    ).toThrow(expect.objectContaining({ code: 'SCOPE_NOT_ALLOWED' }));
  });

  it('throws TASK_NOT_FOUND for unknown ids', () => {
    expect(() =>
      applyCommand(
        emptyDocument(),
        { type: 'deleteTask', taskId: 'nope' },
        makeCtx(),
      ),
    ).toThrow(expect.objectContaining({ code: 'TASK_NOT_FOUND' }));
  });
});

describe('updateOccurrence', () => {
  it('scope "this" stores an override and leaves the task untouched', () => {
    const doc = applyCommand(
      seeded(),
      {
        type: 'updateOccurrence',
        taskId: 'id-1',
        date: '2026-09-23',
        scope: 'this',
        input: { title: 'Only today', time: null, subItems: [] },
      },
      makeCtx(),
    );
    expect(findTask(doc, 'id-1').title).toBe('Brush your teeth');
    expect(
      doc.overrides[makeOccurrenceKey('id-1', '2026-09-23')],
    ).toMatchObject({
      title: 'Only today',
      time: null,
    });
    const days = occurrencesInRange(doc, '2026-09-22', '2026-09-24');
    expect(days.map((o) => o.title)).toEqual([
      'Brush your teeth',
      'Only today',
      'Brush your teeth',
    ]);
  });

  it('scope "future" splits the series and re-keys later states', () => {
    let doc = seeded();
    doc = applyCommand(
      doc,
      {
        type: 'setOccurrenceDone',
        taskId: 'id-1',
        date: '2026-09-21',
        done: true,
      },
      makeCtx(),
    );
    doc = applyCommand(
      doc,
      {
        type: 'setOccurrenceDone',
        taskId: 'id-1',
        date: '2026-09-25',
        done: true,
      },
      makeCtx(),
    );
    doc = applyCommand(
      doc,
      {
        type: 'updateOccurrence',
        taskId: 'id-1',
        date: '2026-09-24',
        scope: 'future',
        input: { title: 'Brush (later)', time: '09:00', subItems: [] },
      },
      makeCtx(10),
    );
    const original = findTask(doc, 'id-1');
    const split = doc.tasks.find((t) => t.id !== 'id-1') as Task;
    expect(original.endDate).toBe('2026-09-23');
    expect(split.startDate).toBe('2026-09-24');
    expect(split.time).toBe('09:00');
    expect(split.repeat).toEqual({ kind: 'daily' });
    expect(split.createdAt).toBe(original.createdAt);
    expect(
      doc.occurrenceStates[makeOccurrenceKey('id-1', '2026-09-21')]?.done,
    ).toBe(true);
    expect(
      doc.occurrenceStates[makeOccurrenceKey(split.id, '2026-09-25')]?.done,
    ).toBe(true);
    expect(
      doc.occurrenceStates[makeOccurrenceKey('id-1', '2026-09-25')],
    ).toBeUndefined();

    const week = occurrencesInRange(doc, '2026-09-22', '2026-09-26');
    expect(week.map((o) => [o.date, o.time])).toEqual([
      ['2026-09-22', '08:00'],
      ['2026-09-23', '08:00'],
      ['2026-09-24', '09:00'],
      ['2026-09-25', '09:00'],
      ['2026-09-26', '09:00'],
    ]);
  });

  it('scope "future" on the first occurrence edits in place', () => {
    const doc = applyCommand(
      seeded(),
      {
        type: 'updateOccurrence',
        taskId: 'id-1',
        date: '2026-09-20',
        scope: 'future',
        input: {
          title: 'Renamed',
          time: '07:00',
          subItems: [],
          repeat: { kind: 'weekdays' },
        },
      },
      makeCtx(),
    );
    expect(doc.tasks).toHaveLength(1);
    expect(doc.tasks[0]).toMatchObject({
      title: 'Renamed',
      time: '07:00',
      repeat: { kind: 'weekdays' },
    });
  });

  it('keeps an earlier "this only" override after a series edit', () => {
    let doc = seeded();
    doc = applyCommand(
      doc,
      {
        type: 'updateOccurrence',
        taskId: 'id-1',
        date: '2026-09-25',
        scope: 'this',
        input: { title: 'Special', time: '10:00', subItems: [] },
      },
      makeCtx(),
    );
    doc = applyCommand(
      doc,
      {
        type: 'updateOccurrence',
        taskId: 'id-1',
        date: '2026-09-23',
        scope: 'future',
        input: { title: 'Series', time: '09:00', subItems: [] },
      },
      makeCtx(10),
    );
    const titles = occurrencesInRange(doc, '2026-09-23', '2026-09-26').map(
      (o) => o.title,
    );
    expect(titles).toEqual(['Series', 'Series', 'Special', 'Series']);
  });

  it('rejects a one-off task and a date with no occurrence', () => {
    const oneOff = seeded(
      input({ repeat: { kind: 'none' }, startDate: '2026-09-22' }),
    );
    expect(() =>
      applyCommand(
        oneOff,
        {
          type: 'updateOccurrence',
          taskId: 'id-1',
          date: '2026-09-22',
          scope: 'this',
          input: { title: 'x', time: null, subItems: [] },
        },
        makeCtx(),
      ),
    ).toThrow(expect.objectContaining({ code: 'SCOPE_NOT_ALLOWED' }));
    expect(() =>
      applyCommand(
        seeded(),
        {
          type: 'updateOccurrence',
          taskId: 'id-1',
          date: '2026-09-01',
          scope: 'this',
          input: { title: 'x', time: null, subItems: [] },
        },
        makeCtx(),
      ),
    ).toThrow(expect.objectContaining({ code: 'TASK_NOT_FOUND' }));
  });
});

describe('deleteTask / deleteOccurrence', () => {
  it('deletes a one-off task with its state', () => {
    let doc = seeded(
      input({ repeat: { kind: 'none' }, startDate: '2026-09-22' }),
    );
    doc = applyCommand(
      doc,
      {
        type: 'setOccurrenceDone',
        taskId: 'id-1',
        date: '2026-09-22',
        done: true,
      },
      makeCtx(),
    );
    doc = applyCommand(doc, { type: 'deleteTask', taskId: 'id-1' }, makeCtx());
    expect(doc.tasks).toEqual([]);
    expect(doc.occurrenceStates).toEqual({});
  });

  it('scope "this" hides one occurrence', () => {
    const doc = applyCommand(
      seeded(),
      {
        type: 'deleteOccurrence',
        taskId: 'id-1',
        date: '2026-09-23',
        scope: 'this',
      },
      makeCtx(),
    );
    expect(
      occurrencesInRange(doc, '2026-09-22', '2026-09-24').map((o) => o.date),
    ).toEqual(['2026-09-22', '2026-09-24']);
  });

  it('scope "future" truncates the series and drops later entries', () => {
    let doc = seeded();
    doc = applyCommand(
      doc,
      {
        type: 'setOccurrenceDone',
        taskId: 'id-1',
        date: '2026-09-27',
        done: true,
      },
      makeCtx(),
    );
    doc = applyCommand(
      doc,
      {
        type: 'deleteOccurrence',
        taskId: 'id-1',
        date: '2026-09-24',
        scope: 'future',
      },
      makeCtx(),
    );
    expect(findTask(doc, 'id-1').endDate).toBe('2026-09-23');
    expect(doc.occurrenceStates).toEqual({});
  });

  it('scope "future" on the first occurrence removes the task', () => {
    const doc = applyCommand(
      seeded(),
      {
        type: 'deleteOccurrence',
        taskId: 'id-1',
        date: '2026-09-20',
        scope: 'future',
      },
      makeCtx(),
    );
    expect(doc.tasks).toEqual([]);
  });
});

describe('endRepeat', () => {
  it('ends the series today and keeps earlier states', () => {
    let doc = seeded();
    doc = applyCommand(
      doc,
      {
        type: 'setOccurrenceDone',
        taskId: 'id-1',
        date: '2026-09-21',
        done: true,
      },
      makeCtx(),
    );
    doc = applyCommand(
      doc,
      {
        type: 'setOccurrenceDone',
        taskId: 'id-1',
        date: '2026-09-23',
        done: true,
      },
      makeCtx(),
    );
    doc = applyCommand(doc, { type: 'endRepeat', taskId: 'id-1' }, makeCtx());
    expect(findTask(doc, 'id-1').endDate).toBe('2026-09-22');
    expect(Object.keys(doc.occurrenceStates)).toEqual([
      makeOccurrenceKey('id-1', '2026-09-21'),
    ]);
  });

  it('removes a series that has not started yet', () => {
    const doc = applyCommand(
      seeded(input({ startDate: '2026-10-01' })),
      { type: 'endRepeat', taskId: 'id-1' },
      makeCtx(),
    );
    expect(doc.tasks).toEqual([]);
  });
});

describe('completion', () => {
  it('tracks done per occurrence and prunes empty states', () => {
    let doc = seeded();
    doc = applyCommand(
      doc,
      {
        type: 'setOccurrenceDone',
        taskId: 'id-1',
        date: '2026-09-22',
        done: true,
      },
      makeCtx(),
    );
    const occurrences = occurrencesInRange(doc, '2026-09-22', '2026-09-23');
    expect(occurrences[0].done).toBe(true);
    expect(occurrences[1].done).toBe(false);
    doc = applyCommand(
      doc,
      {
        type: 'setOccurrenceDone',
        taskId: 'id-1',
        date: '2026-09-22',
        done: false,
      },
      makeCtx(),
    );
    expect(doc.occurrenceStates).toEqual({});
  });

  it('keeps sub-item and task completion independent', () => {
    let doc = seeded();
    doc = applyCommand(
      doc,
      {
        type: 'setSubItemDone',
        taskId: 'id-1',
        date: '2026-09-22',
        subItemId: 'id-2',
        done: true,
      },
      makeCtx(),
    );
    doc = applyCommand(
      doc,
      {
        type: 'setSubItemDone',
        taskId: 'id-1',
        date: '2026-09-22',
        subItemId: 'id-3',
        done: true,
      },
      makeCtx(),
    );
    const state = doc.occurrenceStates[makeOccurrenceKey('id-1', '2026-09-22')];
    expect(state.done).toBe(false);
    expect(state.doneSubItemIds).toEqual(['id-2', 'id-3']);
    doc = applyCommand(
      doc,
      {
        type: 'setOccurrenceDone',
        taskId: 'id-1',
        date: '2026-09-22',
        done: true,
      },
      makeCtx(),
    );
    expect(
      doc.occurrenceStates[makeOccurrenceKey('id-1', '2026-09-22')]
        .doneSubItemIds,
    ).toEqual(['id-2', 'id-3']);
  });

  it('rejects unknown sub-items', () => {
    expect(() =>
      applyCommand(
        seeded(),
        {
          type: 'setSubItemDone',
          taskId: 'id-1',
          date: '2026-09-22',
          subItemId: 'ghost',
          done: true,
        },
        makeCtx(),
      ),
    ).toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }));
  });
});

describe('moveToToday', () => {
  it('moves a one-off task to today and keeps its state', () => {
    let doc = seeded(
      input({ repeat: { kind: 'none' }, startDate: '2026-09-20' }),
    );
    doc = applyCommand(
      doc,
      {
        type: 'setSubItemDone',
        taskId: 'id-1',
        date: '2026-09-20',
        subItemId: 'id-2',
        done: true,
      },
      makeCtx(),
    );
    doc = applyCommand(doc, { type: 'moveToToday', taskId: 'id-1' }, makeCtx());
    expect(findTask(doc, 'id-1').startDate).toBe('2026-09-22');
    expect(
      doc.occurrenceStates[makeOccurrenceKey('id-1', '2026-09-22')]
        .doneSubItemIds,
    ).toEqual(['id-2']);
  });

  it('refuses repeating tasks', () => {
    expect(() =>
      applyCommand(
        seeded(),
        { type: 'moveToToday', taskId: 'id-1' },
        makeCtx(),
      ),
    ).toThrow(expect.objectContaining({ code: 'SCOPE_NOT_ALLOWED' }));
  });
});
