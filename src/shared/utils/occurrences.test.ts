import type { PlannerDocument } from '../models/PlannerDocument';
import type { Task } from '../models/Task';
import { emptyDocument } from '../models/PlannerDocument';
import { makeOccurrenceKey } from './occurrenceKey';
import {
  matchesRule,
  occurrencesInRange,
  sortOccurrences,
} from './occurrences';

const task = (overrides: Partial<Task> & { id: string }): Task => ({
  title: overrides.id,
  startDate: '2026-09-21',
  time: null,
  repeat: { kind: 'none' },
  endDate: null,
  subItems: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const docWith = (
  tasks: Task[],
  extra: Partial<PlannerDocument> = {},
): PlannerDocument => ({ ...emptyDocument(), tasks, ...extra });

// 2026-09-21 is a Monday.
describe('matchesRule', () => {
  it('matches a one-off only on its date', () => {
    const t = task({ id: 'a', startDate: '2026-09-22' });
    expect(matchesRule(t, '2026-09-22')).toBe(true);
    expect(matchesRule(t, '2026-09-23')).toBe(false);
  });

  it('matches daily from startDate to endDate inclusive', () => {
    const t = task({
      id: 'a',
      repeat: { kind: 'daily' },
      startDate: '2026-09-21',
      endDate: '2026-09-23',
    });
    expect(matchesRule(t, '2026-09-20')).toBe(false);
    expect(matchesRule(t, '2026-09-23')).toBe(true);
    expect(matchesRule(t, '2026-09-24')).toBe(false);
  });

  it('matches weekdays and weekly rules', () => {
    const weekdays = task({ id: 'w', repeat: { kind: 'weekdays' } });
    expect(matchesRule(weekdays, '2026-09-25')).toBe(true); // Friday
    expect(matchesRule(weekdays, '2026-09-26')).toBe(false); // Saturday
    const weekly = task({ id: 'k', repeat: { kind: 'weekly', days: [1, 4] } });
    expect(matchesRule(weekly, '2026-09-24')).toBe(true); // Thursday
    expect(matchesRule(weekly, '2026-09-25')).toBe(false);
  });
});

describe('occurrencesInRange', () => {
  it('expands a daily task once per day in range', () => {
    const doc = docWith([task({ id: 'd', repeat: { kind: 'daily' } })]);
    const result = occurrencesInRange(doc, '2026-09-22', '2026-09-24');
    expect(result.map((o) => o.date)).toEqual([
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
    ]);
    expect(result[0].key).toBe('d:2026-09-22');
  });

  it('includes one-off tasks only inside the range', () => {
    const doc = docWith([
      task({ id: 'in', startDate: '2026-09-22' }),
      task({ id: 'out', startDate: '2026-09-30' }),
    ]);
    expect(
      occurrencesInRange(doc, '2026-09-22', '2026-09-22').map((o) => o.taskId),
    ).toEqual(['in']);
  });

  it('applies overrides and skips deleted occurrences', () => {
    const t = task({ id: 'd', repeat: { kind: 'daily' }, time: '08:00' });
    const doc = docWith([t], {
      overrides: {
        [makeOccurrenceKey('d', '2026-09-22')]: {
          title: 'Renamed',
          time: null,
        },
        [makeOccurrenceKey('d', '2026-09-23')]: { deleted: true },
      },
    });
    const result = occurrencesInRange(doc, '2026-09-22', '2026-09-24');
    expect(result.map((o) => o.date)).toEqual(['2026-09-22', '2026-09-24']);
    expect(result[0].title).toBe('Renamed');
    expect(result[0].time).toBeNull();
    expect(result[1].title).toBe('d');
    expect(result[1].time).toBe('08:00');
  });

  it('attaches per-occurrence state and overdue flag', () => {
    const doc = docWith(
      [
        task({ id: 'old', startDate: '2026-09-20' }),
        task({ id: 'done', startDate: '2026-09-20' }),
        task({
          id: 'habit',
          startDate: '2026-09-01',
          repeat: { kind: 'daily' },
        }),
      ],
      {
        occurrenceStates: {
          [makeOccurrenceKey('done', '2026-09-20')]: {
            done: true,
            doneSubItemIds: [],
          },
        },
      },
    );
    const result = occurrencesInRange(
      doc,
      '2026-09-20',
      '2026-09-20',
      '2026-09-22',
    );
    const byId = Object.fromEntries(result.map((o) => [o.taskId, o]));
    expect(byId.old.isOverdue).toBe(true);
    expect(byId.done.isOverdue).toBe(false);
    expect(byId.done.done).toBe(true);
    expect(byId.habit.isOverdue).toBe(false);
  });

  it('rejects ranges longer than 366 days', () => {
    expect(() =>
      occurrencesInRange(emptyDocument(), '2026-01-01', '2027-06-01'),
    ).toThrow(RangeError);
  });

  it('returns nothing for an inverted range', () => {
    expect(
      occurrencesInRange(emptyDocument(), '2026-09-22', '2026-09-21'),
    ).toEqual([]);
  });
});

describe('sortOccurrences', () => {
  it('orders by date, timed before anytime, time, then creation', () => {
    const doc = docWith([
      task({ id: 'late', startDate: '2026-09-22', time: '19:00' }),
      task({ id: 'any', startDate: '2026-09-22', time: null }),
      task({
        id: 'sameB',
        startDate: '2026-09-22',
        time: '09:00',
        createdAt: '2026-09-02T00:00:00.000Z',
      }),
      task({
        id: 'sameA',
        startDate: '2026-09-22',
        time: '09:00',
        createdAt: '2026-09-01T00:00:00.000Z',
      }),
      task({ id: 'night', startDate: '2026-09-22', time: '23:30' }),
    ]);
    const ids = sortOccurrences(
      occurrencesInRange(doc, '2026-09-22', '2026-09-22'),
    ).map((o) => o.taskId);
    expect(ids).toEqual(['sameA', 'sameB', 'late', 'night', 'any']);
  });
});
