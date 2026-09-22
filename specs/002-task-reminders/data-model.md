# Data Model: Task Reminders

**Feature**: `002-task-reminders` | **Date**: 2026-09-22

Extends the feature 001 model. Only deltas are described; unchanged fields keep their rules.

## Schema changes (document version 1 → 2)

### Task (extended)

| Field | Type | Rules |
|-------|------|-------|
| `reminderMinutesBefore` | `5 \| 15 \| 30 \| 45 \| 60 \| null` | `null` = no reminder. Meaningful only when `time !== null`; when `time` is cleared the value is kept but ignored (FR-010 spirit: the setting survives). Required in v2. |

### OccurrenceOverride (extended)

| Field | Type | Rules |
|-------|------|-------|
| `reminderMinutesBefore` | `5 \| 15 \| 30 \| 45 \| 60 \| null` (optional) | Present only after a "this occurrence only" edit that changed the reminder. |

### Occurrence (derived, extended)

| Field | Type | Source |
|-------|------|--------|
| `reminderMinutesBefore` | as above | override ?? task |

### ReminderPreferences (new, stored in `PlannerDocument.preferences`)

| Field | Type | Default | Rules |
|-------|------|---------|-------|
| `remindersEnabled` | `boolean` | `true` | App-wide switch (FR-002, FR-013). |
| `defaultReminderMinutesBefore` | `5 \| 15 \| 30 \| 45 \| 60 \| null` | `15` | Preselected value for new tasks (FR-015). `null` makes new tasks opt-in. |
| `permissionPromptShown` | `boolean` | `false` | Set when the OS prompt has been shown once (FR-009). |
| `exactAlarmPromptShown` | `boolean` | `false` | Set when the exact-alarm explanation has been shown once (R2). |

### PlannerDocument v2

```
{
  version: 2,
  tasks: Task[],                       // each with reminderMinutesBefore
  occurrenceStates: Record<OccurrenceKey, OccurrenceState>,
  overrides: Record<OccurrenceKey, OccurrenceOverride>,
  preferences: ReminderPreferences
}
```

### Migration v1 → v2

- `version: 2`.
- Every task gets `reminderMinutesBefore: 15` (the initial app-wide default; FR-015).
- `preferences` = defaults above.
- Overrides are left untouched (no reminder override exists in v1).
- `migrate()` accepts v1 and v2; anything else is `corrupt`. `normalize()` rules from feature
  001 still apply.

## Reminder eligibility (per occurrence)

An occurrence produces a reminder when **all** hold:

1. `preferences.remindersEnabled === true`.
2. The occurrence exists (matches the rule, not deleted by an override).
3. `occurrence.time !== null`.
4. `occurrence.reminderMinutesBefore !== null`.
5. `occurrence.done === false`.
6. `fireAt = localDateTime(date, time) − minutes` is strictly after `now`.
7. `date` is within `[today, today + 14 days]`.

Permission state does **not** change the plan; it only decides whether the gateway can act.
The plan is the truth about intent; the gateway reports capability.

## Derived: ReminderRequest

| Field | Type | Derivation |
|-------|------|------------|
| `id` | `number` (1..2^31−1) | `notificationId(occurrenceKey)` (contracts/notification-payload.md) |
| `occurrenceKey` | `string` | `${taskId}:${date}` |
| `taskId`, `date` | | from the occurrence; carried in `extra` |
| `fireAt` | `Date` (local) | `localDateTime(date, time) − minutes` |
| `title` | `string` | occurrence title |
| `body` | `string` | `formatReminderBody(minutes, time, subItems)` |

`computeReminderPlan(doc, now)` returns requests sorted by `fireAt`, capped at 450 entries
(earliest first) with a console warning if truncated.

## Command effects on reminders

Reminders are never mutated by commands directly. After any successful command,
`syncReminders()` recomputes the plan and reconciles (contracts/reminder-scheduler.md). The
table shows the *observable* outcome that tests assert:

| Command | Outcome on OS state |
|---------|---------------------|
| `createTask` with time + reminder | new reminder scheduled if `fireAt > now` |
| `updateTask` (time / date / reminder / clear time) | old id cancelled when key or content changes; new one scheduled per plan |
| `updateOccurrence` `this` | that occurrence's reminder re-derived from its override |
| `updateOccurrence` `future` (series split) | reminders from the split date re-keyed to the new task id: old ids cancelled, new ids scheduled |
| `deleteTask`, `deleteOccurrence` (`this`/`future`), `endRepeat` | affected ids cancelled |
| `setOccurrenceDone` true / false | cancelled / restored (if still ahead) |
| `moveToToday` | rescheduled for today if `fireAt > now`, else cancelled |
| `setReminderPreferences` `remindersEnabled=false` | everything cancelled |
| `setReminderPreferences` `remindersEnabled=true` | plan scheduled |
| `setReminderPreferences` default change | no effect on existing tasks |

## New command

```
{ type: 'setReminderPreferences'; patch: Partial<ReminderPreferences> }
```

Validated by `reminderPreferencesSchema.partial()`; merges into `doc.preferences`.

`TaskInput` and `OccurrenceInput` gain `reminderMinutesBefore` (required in `TaskInput`,
optional in `OccurrenceInput`; when omitted in a `this` edit, the existing value is kept).

## Validation summary

| Rule | Where enforced |
|------|----------------|
| Lead ∈ {5, 15, 30, 45, 60} or null | `reminderLeadSchema` (Zod union of literals) |
| Default lead same domain | `reminderPreferencesSchema` |
| v2 shape | `plannerDocumentSchema` (v2), `migrate()` |
| id range 1..2^31−1 | `notificationId()` unit test |
| plan cap 450 | `computeReminderPlan()` unit test |
