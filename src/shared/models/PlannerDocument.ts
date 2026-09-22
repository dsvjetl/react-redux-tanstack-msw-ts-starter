import { z } from 'zod';

import {
  type OccurrenceOverride,
  type OccurrenceState,
  occurrenceOverrideSchema,
  occurrenceStateSchema,
} from './Occurrence';
import { type Task, taskSchema } from './Task';
import { matchesRule } from '../utils/occurrences';
import { parseOccurrenceKey } from '../utils/occurrenceKey';

const PLANNER_DOCUMENT_VERSION = 1;

const plannerDocumentSchema = z.object({
  version: z.literal(PLANNER_DOCUMENT_VERSION),
  tasks: z.array(taskSchema),
  occurrenceStates: z.record(z.string(), occurrenceStateSchema),
  overrides: z.record(z.string(), occurrenceOverrideSchema),
});

export type PlannerDocument = z.infer<typeof plannerDocumentSchema>;

export const emptyDocument = (): PlannerDocument => ({
  version: PLANNER_DOCUMENT_VERSION,
  tasks: [],
  occurrenceStates: {},
  overrides: {},
});

type MigrateResult =
  | { status: 'ok'; doc: PlannerDocument }
  | { status: 'corrupt'; doc: PlannerDocument; reason: string };

/**
 * Bring an unknown payload to the current document version. Unknown or
 * invalid payloads are reported as corrupt and replaced by an empty document.
 */
export const migrate = (payload: unknown): MigrateResult => {
  const parsed = plannerDocumentSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: 'corrupt',
      doc: emptyDocument(),
      reason: parsed.error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; '),
    };
  }
  return { status: 'ok', doc: normalize(parsed.data) };
};

const isMeaningfulState = (state: OccurrenceState) =>
  state.done || state.doneSubItemIds.length > 0;

/**
 * Drop entries that no longer make sense: keys whose task is gone or whose
 * date does not match the task's rule, sub-item ids that no longer exist, and
 * empty states. Pure; returns a new document.
 */
export const normalize = (doc: PlannerDocument): PlannerDocument => {
  const tasksById = new Map<string, Task>(doc.tasks.map((t) => [t.id, t]));

  const keyIsValid = (key: string): { task: Task; date: string } | null => {
    const parsed = parseOccurrenceKey(key);
    if (!parsed) return null;
    const task = tasksById.get(parsed.taskId);
    if (!task || !matchesRule(task, parsed.date)) return null;
    return { task, date: parsed.date };
  };

  const overrides: Record<string, OccurrenceOverride> = {};
  for (const [key, override] of Object.entries(doc.overrides)) {
    if (keyIsValid(key)) overrides[key] = override;
  }

  const occurrenceStates: Record<string, OccurrenceState> = {};
  for (const [key, state] of Object.entries(doc.occurrenceStates)) {
    const valid = keyIsValid(key);
    if (!valid) continue;
    const override = overrides[key];
    if (override?.deleted) continue;
    const subItems = override?.subItems ?? valid.task.subItems;
    const knownIds = new Set(subItems.map((s) => s.id));
    const pruned: OccurrenceState = {
      done: state.done,
      doneSubItemIds: state.doneSubItemIds.filter((id) => knownIds.has(id)),
    };
    if (isMeaningfulState(pruned)) occurrenceStates[key] = pruned;
  }

  return { ...doc, tasks: [...doc.tasks], occurrenceStates, overrides };
};
