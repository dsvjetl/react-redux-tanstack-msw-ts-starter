# Data Model: Daily Todo Planner

**Feature**: `001-daily-todo-planner` | **Date**: 2026-09-22

All types live in `src/shared/models/` as Zod schemas with inferred TypeScript types. Dates are
local calendar dates as `YYYY-MM-DD` strings (`DateKey`); times are `HH:mm` (`TimeKey`).

## Entities

### Task

The definition of something to do, one-off or repeating.

| Field | Type | Rules |
|-------|------|-------|
| `id` | `string` (UUID v4) | Immutable. |
| `title` | `string` | 1–120 chars after trim. Required. |
| `startDate` | `DateKey` | Required. For a one-off task this is *the* date. |
| `time` | `TimeKey \| null` | Optional. Minutes must be a multiple of 5. |
| `repeat` | `RepeatRule` | Default `{ kind: 'none' }`. |
| `endDate` | `DateKey \| null` | Inclusive last day an occurrence may appear. Only meaningful when `repeat.kind !== 'none'`. Set by "End repeat" and by series splits. Must be `>= startDate` when present. |
| `subItems` | `SubItem[]` | 0–10 items, ordered. |
| `createdAt` | ISO 8601 datetime string | Ordering tie-break and creation order. |
| `updatedAt` | ISO 8601 datetime string | Bumped by every command that touches the task. |

### RepeatRule

Discriminated union:

| Variant | Shape | Matches day when |
|---------|-------|------------------|
| none | `{ kind: 'none' }` | day === `startDate` |
| daily | `{ kind: 'daily' }` | every day |
| weekdays | `{ kind: 'weekdays' }` | Monday–Friday |
| weekly | `{ kind: 'weekly', days: Weekday[] }` | day-of-week ∈ `days`; `days` is a non-empty, de-duplicated array of `1..7` (ISO, 1 = Monday) |

A day matches only if `startDate <= day <= (endDate ?? ∞)`.

### SubItem

| Field | Type | Rules |
|-------|------|-------|
| `id` | `string` (UUID) | Immutable. |
| `text` | `string` | 1–80 chars after trim. |

Done state of a sub-item is **not** on the SubItem; it is per occurrence (below).

### Occurrence (derived, never stored as a whole)

One appearance of a Task on one day. Computed by `occurrencesInRange()`.

| Field | Type | Source |
|-------|------|--------|
| `key` | `OccurrenceKey` = `` `${taskId}:${date}` `` | derived |
| `taskId` | `string` | Task |
| `date` | `DateKey` | expansion |
| `title`, `time`, `subItems` | as Task | Task, then `OccurrenceOverride` applied |
| `repeatKind` | `RepeatRule['kind']` | Task (for the repeat badge) |
| `done` | `boolean` | `OccurrenceState.done`, default `false` |
| `doneSubItemIds` | `string[]` | `OccurrenceState`, default `[]` |
| `isOverdue` | `boolean` | `repeat.kind === 'none' && date < today && !done` |

### OccurrenceState (stored)

Keyed by `OccurrenceKey` in `PlannerDocument.occurrenceStates`.

| Field | Type | Rules |
|-------|------|-------|
| `done` | `boolean` | |
| `doneSubItemIds` | `string[]` | Subset of the occurrence's sub-item ids; unknown ids are ignored on read and pruned on write. |

Entries whose `done === false` and `doneSubItemIds.length === 0` are deleted rather than
stored, so the map only holds real progress.

### OccurrenceOverride (stored)

Keyed by `OccurrenceKey` in `PlannerDocument.overrides`. Produced by "this occurrence only"
edits or deletes of a repeating task.

| Field | Type | Meaning |
|-------|------|---------|
| `deleted` | `true \| undefined` | Occurrence is skipped entirely. |
| `title` | `string?` | Replaces the task title for this day. |
| `time` | `TimeKey \| null` (optional) | Replaces the time for this day (`null` = anytime). |
| `subItems` | `SubItem[]?` | Replaces the sub-item list for this day. |

Overrides are only valid for tasks with `repeat.kind !== 'none'`; a one-off task is edited
directly.

### PlannerDocument (stored, versioned)

```
{
  version: 1,
  tasks: Task[],
  occurrenceStates: Record<OccurrenceKey, OccurrenceState>,
  overrides: Record<OccurrenceKey, OccurrenceOverride>
}
```

Invariants (enforced by `plannerDocumentSchema` and `applyCommand`):

- `tasks[].id` unique.
- Every `occurrenceStates` / `overrides` key references an existing task id.
- A key's date must satisfy the task's rule (checked lazily on read; violating entries are
  dropped by `migrate()`/`normalize()` with a console warning).
- Loading a document that fails the schema yields the "storage unavailable or corrupted" edge
  case: the app starts with an empty document and shows a non-blocking error state; the
  corrupted payload is kept under key `daily-todo-planner.corrupt` for later inspection and
  is never overwritten twice.

## Derived views

### Today view (`useTodayOccurrences(now)`)

Input: document, `today = toDateKey(now)`, `nowTime = toTimeKey(now)`.

1. `overdue`: occurrences of **one-off** tasks with `date < today`, `date >= today − 30 days`,
   `!done`, sorted by date then time then `createdAt`.
2. `todays`: `occurrencesInRange(doc, today, today)` minus deleted overrides.
3. `timed`: `todays` with `time !== null`, sorted by time then `createdAt`.
4. `anytime`: `todays` with `time === null`, sorted by `createdAt`.
5. `upNext`: first of `timed` where `!done && time >= nowTime`, else `null`.
6. `remainingCount`: count of `!done` in `overdue ∪ todays`.

### Calendar view (`useWeekOccurrences(weekStart)`)

Input: document, `weekStart` (DateKey, defaults to today), `days = [weekStart .. weekStart+6]`.
Output: `Record<DateKey, { anytime: Occurrence[]; timed: Occurrence[] }>` with the same sort
rules as Today, plus `rangeLabel` ("22 – 28 Sep" or "28 Sep – 4 Oct" across months) and
`isToday(date)`.

Hour grid: rows for 06:00–23:00. A timed occurrence's row = `hour − 6`, clamped to `[0, 17]`;
the block always shows its real time text.

## Recurrence expansion

`occurrencesInRange(doc, from, to): Occurrence[]`

```
for each task in doc.tasks:
  lo = max(task.startDate, from)
  hi = min(task.endDate ?? to, to)
  if lo > hi: continue
  candidate days = task.repeat.kind === 'none' ? [task.startDate] (if within [lo, hi])
                   : every day d in [lo, hi] where matches(task.repeat, d)
  for each day d:
    key = `${task.id}:${d}`
    override = doc.overrides[key]
    if override?.deleted: continue
    emit occurrence(task ⊕ override, state = doc.occurrenceStates[key] ?? empty)
```

Range is capped at 366 days by the callers (Calendar navigation) so expansion stays bounded.

## Commands and state transitions

All mutations are values of the `PlannerCommand` union applied by
`applyCommand(doc, cmd, ctx: { now: Date; newId(): string }) → PlannerDocument` (pure).
See `contracts/task-repository.md` for the full list. Transition rules:

| Command | Effect | Notes |
|---------|--------|-------|
| `createTask` | Append validated task. | `id`, `createdAt`, `updatedAt` from `ctx`. |
| `updateTask` (one-off) | Replace fields; if `startDate` changes, move its `occurrenceStates` entry to the new key. | Overrides never exist for one-off tasks. |
| `updateOccurrence` (`scope: 'this'`) | Upsert `overrides[key]` with the changed fields. | Only for repeating tasks. Changing `startDate` in this scope is not allowed (UI hides it). |
| `updateOccurrence` (`scope: 'future'`) | **Series split**: original task gets `endDate = date − 1 day` (or is deleted if that is before `startDate`); a new task is created with the new values, `startDate = date`, same `repeat`, `endDate = original.endDate`; `occurrenceStates` and `overrides` with `date' >= date` are re-keyed to the new task id. | Past occurrences keep their states and overrides. |
| `deleteTask` (one-off) | Remove task and its state entries. | Requires confirm (UI). |
| `deleteOccurrence` (`scope: 'this'`) | `overrides[key] = { deleted: true }`; drop its state. | |
| `deleteOccurrence` (`scope: 'future'`) | `endDate = date − 1 day`; if that precedes `startDate`, delete the task; drop states/overrides with `date' >= date`. | |
| `endRepeat` | `endDate = today`; drop states/overrides with `date' > today`. | Occurrences up to today remain. |
| `setOccurrenceDone` | Set `done`; prune empty state entries. | Does not touch sub-item states (FR-007). |
| `setSubItemDone` | Add/remove id in `doneSubItemIds`. | Does not touch `done` (FR-007). |
| `moveToToday` | One-off only: `startDate = today`, re-key its state. | Overdue action (FR-014). |

Every command bumps `updatedAt` on the touched task(s). Commands throw a typed
`PlannerCommandError` on invariant violations (unknown task id, scope misuse); the mutation
hook surfaces it as the error state and rolls back the optimistic update.

## Validation summary (from FR-004, FR-017)

| Rule | Where enforced |
|------|----------------|
| Title 1–120 chars | `taskFormSchema`, `taskSchema` |
| Time in 5-minute steps | `timeKeySchema` refine |
| Sub-items ≤ 10, each 1–80 chars | `taskFormSchema`, `taskSchema` |
| Weekly rule has ≥ 1 day | `repeatRuleSchema` refine |
| `endDate >= startDate` | `taskSchema` refine |
| Document integrity | `plannerDocumentSchema` + `normalize()` |
