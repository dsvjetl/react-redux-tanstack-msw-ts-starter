import { z } from 'zod';

import {
  type DateKey,
  type RepeatKind,
  type SubItem,
  type TimeKey,
  subItemSchema,
  timeKeySchema,
  titleSchema,
} from './Task';

/** `${taskId}:${date}` */
export type OccurrenceKey = string;

export const occurrenceStateSchema = z.object({
  done: z.boolean(),
  doneSubItemIds: z.array(z.string().min(1)),
});

export type OccurrenceState = z.infer<typeof occurrenceStateSchema>;

export const occurrenceOverrideSchema = z
  .object({
    deleted: z.literal(true).optional(),
    title: titleSchema.optional(),
    time: timeKeySchema.nullable().optional(),
    subItems: z.array(subItemSchema).max(10).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    'An override must change something',
  );

export type OccurrenceOverride = z.infer<typeof occurrenceOverrideSchema>;

/** One appearance of a task on one day. Derived, never stored as a whole. */
export interface Occurrence {
  key: OccurrenceKey;
  taskId: string;
  date: DateKey;
  title: string;
  time: TimeKey | null;
  subItems: SubItem[];
  repeatKind: RepeatKind;
  done: boolean;
  doneSubItemIds: string[];
  isOverdue: boolean;
  createdAt: string;
}

export const emptyOccurrenceState = (): OccurrenceState => ({
  done: false,
  doneSubItemIds: [],
});
