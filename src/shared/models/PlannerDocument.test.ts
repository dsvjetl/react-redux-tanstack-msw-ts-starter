import { emptyDocument, migrate, normalize } from './PlannerDocument';
import type { Task } from './Task';

const task: Task = {
  id: 't1',
  title: 'Habit',
  startDate: '2026-09-21',
  time: '08:00',
  repeat: { kind: 'weekdays' },
  endDate: null,
  subItems: [{ id: 's1', text: 'one' }],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('migrate', () => {
  it('accepts a valid v1 document', () => {
    const result = migrate({ ...emptyDocument(), tasks: [task] });
    expect(result.status).toBe('ok');
    expect(result.doc.tasks).toHaveLength(1);
  });

  it('reports corrupt payloads and returns an empty document', () => {
    const result = migrate({ version: 1, tasks: 'nope' });
    expect(result.status).toBe('corrupt');
    expect(result.doc).toEqual(emptyDocument());
    if (result.status === 'corrupt') {
      expect(result.reason).toContain('tasks');
    }
  });

  it('rejects unknown versions', () => {
    expect(migrate({ ...emptyDocument(), version: 2 }).status).toBe('corrupt');
  });
});

describe('normalize', () => {
  it('drops orphan keys, non-matching dates, unknown sub-item ids and empty states', () => {
    const doc = normalize({
      ...emptyDocument(),
      tasks: [task],
      occurrenceStates: {
        'missing:2026-09-21': { done: true, doneSubItemIds: [] },
        't1:2026-09-26': { done: true, doneSubItemIds: [] }, // Saturday, no occurrence
        't1:2026-09-21': { done: false, doneSubItemIds: ['s1', 'ghost'] },
        't1:2026-09-22': { done: false, doneSubItemIds: [] },
      },
      overrides: {
        'missing:2026-09-21': { title: 'x' },
        't1:2026-09-23': { deleted: true },
      },
    });
    expect(Object.keys(doc.occurrenceStates)).toEqual(['t1:2026-09-21']);
    expect(doc.occurrenceStates['t1:2026-09-21'].doneSubItemIds).toEqual([
      's1',
    ]);
    expect(Object.keys(doc.overrides)).toEqual(['t1:2026-09-23']);
  });

  it('drops state for deleted occurrences', () => {
    const doc = normalize({
      ...emptyDocument(),
      tasks: [task],
      occurrenceStates: { 't1:2026-09-23': { done: true, doneSubItemIds: [] } },
      overrides: { 't1:2026-09-23': { deleted: true } },
    });
    expect(doc.occurrenceStates).toEqual({});
  });
});
