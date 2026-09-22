import { z } from 'zod';

import type { Occurrence } from '../../models/Occurrence';
import {
  type DateKey,
  type RepeatKind,
  SUB_ITEM_LIMIT,
  type Task,
  type TaskInput,
  type Weekday,
  dateKeySchema,
  subItemTextSchema,
  timeKeySchema,
  titleSchema,
  weekdaySchema,
} from '../../models/Task';

const taskFormValuesSchema = z
  .object({
    title: titleSchema,
    startDate: dateKeySchema,
    time: z.union([z.literal(''), timeKeySchema]),
    repeatKind: z.enum(['none', 'daily', 'weekdays', 'weekly']),
    weeklyDays: z.array(weekdaySchema),
    subItems: z
      .array(z.object({ id: z.string().optional(), text: subItemTextSchema }))
      .max(SUB_ITEM_LIMIT, 'Up to 10 sub-items'),
  })
  .superRefine((values, ctx) => {
    if (values.repeatKind === 'weekly' && values.weeklyDays.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['weeklyDays'],
        message: 'Pick at least one day',
      });
    }
  });

type TaskFormValues = z.infer<typeof taskFormValuesSchema>;

const emptyFormValues = (startDate: DateKey): TaskFormValues => ({
  title: '',
  startDate,
  time: '',
  repeatKind: 'none',
  weeklyDays: [],
  subItems: [],
});

const formValuesFromTask = (task: Task): TaskFormValues => ({
  title: task.title,
  startDate: task.startDate,
  time: task.time ?? '',
  repeatKind: task.repeat.kind,
  weeklyDays: task.repeat.kind === 'weekly' ? [...task.repeat.days] : [],
  subItems: task.subItems.map((s) => ({ id: s.id, text: s.text })),
});

const formValuesFromOccurrence = (
  task: Task,
  occurrence: Occurrence,
): TaskFormValues => ({
  ...formValuesFromTask(task),
  title: occurrence.title,
  time: occurrence.time ?? '',
  subItems: occurrence.subItems.map((s) => ({ id: s.id, text: s.text })),
});

const toRepeatRule = (kind: RepeatKind, weeklyDays: Weekday[]) =>
  kind === 'weekly' ? { kind, days: weeklyDays } : { kind };

const toTaskInput = (values: TaskFormValues): TaskInput => ({
  title: values.title.trim(),
  startDate: values.startDate,
  time: values.time === '' ? null : values.time,
  repeat: toRepeatRule(values.repeatKind, values.weeklyDays as Weekday[]),
  subItems: values.subItems.map((s) => ({ id: s.id, text: s.text.trim() })),
});

export {
  emptyFormValues,
  formValuesFromOccurrence,
  formValuesFromTask,
  taskFormValuesSchema,
  toTaskInput,
};
export type { TaskFormValues };
