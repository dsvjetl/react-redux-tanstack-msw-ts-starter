import {
  dateKeySchema,
  repeatRuleSchema,
  subItemSchema,
  taskInputSchema,
  taskSchema,
  timeKeySchema,
} from './Task';

const baseTask = {
  id: 't1',
  title: 'Make bed',
  startDate: '2026-09-22',
  time: null,
  repeat: { kind: 'none' as const },
  endDate: null,
  subItems: [],
  createdAt: '2026-09-22T08:00:00.000Z',
  updatedAt: '2026-09-22T08:00:00.000Z',
};

describe('dateKeySchema', () => {
  it('accepts a real ISO date', () => {
    expect(dateKeySchema.safeParse('2026-09-22').success).toBe(true);
  });

  it('rejects malformed and impossible dates', () => {
    expect(dateKeySchema.safeParse('22-09-2026').success).toBe(false);
    expect(dateKeySchema.safeParse('2026-02-30').success).toBe(false);
  });
});

describe('timeKeySchema', () => {
  it('accepts 5-minute steps', () => {
    expect(timeKeySchema.safeParse('08:00').success).toBe(true);
    expect(timeKeySchema.safeParse('23:55').success).toBe(true);
  });

  it('rejects other minutes and bad hours with the contract message', () => {
    const result = timeKeySchema.safeParse('08:03');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Use 5-minute steps');
    }
    expect(timeKeySchema.safeParse('24:00').success).toBe(false);
  });
});

describe('repeatRuleSchema', () => {
  it('accepts every kind', () => {
    expect(repeatRuleSchema.safeParse({ kind: 'none' }).success).toBe(true);
    expect(repeatRuleSchema.safeParse({ kind: 'daily' }).success).toBe(true);
    expect(repeatRuleSchema.safeParse({ kind: 'weekdays' }).success).toBe(true);
    expect(
      repeatRuleSchema.safeParse({ kind: 'weekly', days: [1, 4] }).success,
    ).toBe(true);
  });

  it('requires at least one weekly day', () => {
    const result = repeatRuleSchema.safeParse({ kind: 'weekly', days: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Pick at least one day');
    }
  });

  it('rejects duplicate or out-of-range days', () => {
    expect(
      repeatRuleSchema.safeParse({ kind: 'weekly', days: [1, 1] }).success,
    ).toBe(false);
    expect(
      repeatRuleSchema.safeParse({ kind: 'weekly', days: [0] }).success,
    ).toBe(false);
  });
});

describe('subItemSchema', () => {
  it('trims and bounds text to 1–80 characters', () => {
    expect(subItemSchema.safeParse({ id: 's', text: '  x ' }).success).toBe(
      true,
    );
    expect(subItemSchema.safeParse({ id: 's', text: '   ' }).success).toBe(
      false,
    );
    expect(
      subItemSchema.safeParse({ id: 's', text: 'a'.repeat(81) }).success,
    ).toBe(false);
  });
});

describe('taskSchema', () => {
  it('accepts a valid task', () => {
    expect(taskSchema.safeParse(baseTask).success).toBe(true);
  });

  it('bounds title to 1–120 characters with contract messages', () => {
    const empty = taskSchema.safeParse({ ...baseTask, title: ' ' });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.error.issues[0].message).toBe('Title is required');
    }
    const long = taskSchema.safeParse({ ...baseTask, title: 'a'.repeat(121) });
    expect(long.success).toBe(false);
    if (!long.success) {
      expect(long.error.issues[0].message).toBe(
        'Keep the title under 120 characters',
      );
    }
  });

  it('allows at most 10 sub-items', () => {
    const subItems = Array.from({ length: 11 }, (_, i) => ({
      id: `s${i}`,
      text: `item ${i}`,
    }));
    expect(taskSchema.safeParse({ ...baseTask, subItems }).success).toBe(false);
    expect(
      taskSchema.safeParse({ ...baseTask, subItems: subItems.slice(0, 10) })
        .success,
    ).toBe(true);
  });

  it('requires endDate on or after startDate', () => {
    expect(
      taskSchema.safeParse({
        ...baseTask,
        repeat: { kind: 'daily' },
        endDate: '2026-09-21',
      }).success,
    ).toBe(false);
    expect(
      taskSchema.safeParse({
        ...baseTask,
        repeat: { kind: 'daily' },
        endDate: '2026-09-22',
      }).success,
    ).toBe(true);
  });
});

describe('taskInputSchema', () => {
  it('accepts sub-items without ids', () => {
    const result = taskInputSchema.safeParse({
      title: 'Read',
      startDate: '2026-09-22',
      time: '20:00',
      repeat: { kind: 'none' },
      subItems: [{ text: 'Chapter 1' }],
    });
    expect(result.success).toBe(true);
  });
});
