import { z } from 'zod';
import { isValid, parse } from 'date-fns';

/** Local calendar date, `YYYY-MM-DD`. */
export type DateKey = string;
/** Local wall-clock time, `HH:mm`, in 5-minute steps. */
export type TimeKey = string;
/** ISO weekday, 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_KEY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const isRealDate = (key: string) =>
  isValid(parse(key, 'yyyy-MM-dd', new Date()));

export const dateKeySchema = z
  .string()
  .regex(DATE_KEY_PATTERN, 'Pick a date')
  .refine(isRealDate, 'Pick a date');

export const timeKeySchema = z
  .string()
  .regex(TIME_KEY_PATTERN, 'Use 5-minute steps')
  .refine((value) => Number(value.slice(3)) % 5 === 0, 'Use 5-minute steps');

export const weekdaySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);

export const repeatRuleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('daily') }),
  z.object({ kind: z.literal('weekdays') }),
  z.object({
    kind: z.literal('weekly'),
    days: z
      .array(weekdaySchema)
      .min(1, 'Pick at least one day')
      .max(7)
      .refine(
        (days) => new Set(days).size === days.length,
        'Pick each day only once',
      ),
  }),
]);

export type RepeatRule = z.infer<typeof repeatRuleSchema>;
export type RepeatKind = RepeatRule['kind'];

export const SUB_ITEM_LIMIT = 10;
const TITLE_MAX_LENGTH = 120;
const SUB_ITEM_MAX_LENGTH = 80;

export const subItemTextSchema = z
  .string()
  .trim()
  .min(1, 'Sub-item text is required')
  .max(SUB_ITEM_MAX_LENGTH, 'Keep it under 80 characters');

export const subItemSchema = z.object({
  id: z.string().min(1),
  text: subItemTextSchema,
});

export type SubItem = z.infer<typeof subItemSchema>;

export const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(TITLE_MAX_LENGTH, 'Keep the title under 120 characters');

const endDateAfterStart = (value: {
  startDate: DateKey;
  endDate: DateKey | null;
}) => value.endDate === null || value.endDate >= value.startDate;

export const taskSchema = z
  .object({
    id: z.string().min(1),
    title: titleSchema,
    startDate: dateKeySchema,
    time: timeKeySchema.nullable(),
    repeat: repeatRuleSchema,
    endDate: dateKeySchema.nullable(),
    subItems: z.array(subItemSchema).max(SUB_ITEM_LIMIT, 'Up to 10 sub-items'),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .refine(endDateAfterStart, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  });

export type Task = z.infer<typeof taskSchema>;

/** What the editor submits for create / update. Ids of sub-items are optional. */
export const taskInputSchema = z.object({
  title: titleSchema,
  startDate: dateKeySchema,
  time: timeKeySchema.nullable(),
  repeat: repeatRuleSchema,
  subItems: z
    .array(
      z.object({ id: z.string().min(1).optional(), text: subItemTextSchema }),
    )
    .max(SUB_ITEM_LIMIT, 'Up to 10 sub-items'),
});

export type TaskInput = z.infer<typeof taskInputSchema>;

/** Fields that may change for a single occurrence or a series tail. */
export const occurrenceInputSchema = taskInputSchema
  .pick({ title: true, time: true, subItems: true })
  .extend({ repeat: repeatRuleSchema.optional() });

export type OccurrenceInput = z.infer<typeof occurrenceInputSchema>;

export const isRepeating = (task: Pick<Task, 'repeat'>) =>
  task.repeat.kind !== 'none';
