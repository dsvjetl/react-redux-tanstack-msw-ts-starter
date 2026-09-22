# Contract: Reminder scheduler

**Feature**: `002-task-reminders` | Implementation: `src/shared/utils/reminders/`,
`src/shared/services/native/notifications.ts`, `src/shared/hooks/useReminderSync.ts`

## 1. Pure planning

```ts
export interface ReminderRequest {
  id: number;                // stable, 1..2^31-1
  occurrenceKey: string;
  taskId: string;
  date: DateKey;
  fireAt: Date;              // local time
  title: string;
  body: string;
}

export const REMINDER_HORIZON_DAYS = 14;
export const REMINDER_PLAN_CAP = 450;

/** Everything the OS should hold right now. Pure; sorted by fireAt; capped. */
export function computeReminderPlan(doc: PlannerDocument, now: Date): ReminderRequest[];
```

Eligibility rules: data-model.md "Reminder eligibility".

## 2. Pure reconciliation

```ts
export interface PendingReminder {
  id: number;
  title: string;
  body: string;
  fireAt: Date | null;       // null when the OS cannot report it
}

export interface ReminderDiff {
  cancel: number[];          // ids present in pending but not in plan, or changed
  schedule: ReminderRequest[]; // requests missing from pending, or changed
}

/** Diff by id; an entry is "changed" when title, body or fireAt (to the minute) differ. */
export function reconcileReminders(plan: ReminderRequest[], pending: PendingReminder[]): ReminderDiff;
```

Guarantees: idempotent (`reconcile(plan, apply(plan))` is empty); never schedules a request
whose `fireAt <= now` (the plan already excludes them); cancels unknown ids so orphans from
older app versions are cleaned up.

## 3. Gateway (the only module that touches the plugin)

```ts
export type PermissionState = 'granted' | 'denied' | 'prompt';
export type ExactAlarmState = 'granted' | 'denied' | 'unsupported';

export interface NotificationGateway {
  checkPermission(): Promise<PermissionState>;
  requestPermission(): Promise<PermissionState>;
  checkExactAlarm(): Promise<ExactAlarmState>;
  openExactAlarmSettings(): Promise<void>;
  openNotificationSettings(): Promise<void>;        // NotificationSettingsPlugin on Android; no-op elsewhere
  ensureChannel(): Promise<void>;                   // creates 'reminders' channel once (Android only)
  getPending(): Promise<PendingReminder[]>;
  schedule(requests: ReminderRequest[]): Promise<void>;
  cancel(ids: number[]): Promise<void>;
  onTap(handler: (target: { taskId: string; date: DateKey }) => void): () => void;
  onFiredInForeground(handler: (id: number) => void): () => void; // web/foreground chime
}
```

Implementations:

| Class | Backing | Used when |
|-------|---------|-----------|
| `CapacitorNotificationGateway` | `@capacitor/local-notifications` (+ web impl) and `NotificationSettingsPlugin` | production, `npm run dev` |
| `FakeNotificationGateway` | in-memory pending map, settable permission/exact states, `fire(id)` test helper | all tests, `npm run dev:mock` |

`NotificationGatewayProvider` / `useNotificationGateway()` inject the instance (same pattern
as `TaskRepositoryProvider`).

## 4. Sync hook

```ts
/** Recompute the plan and reconcile it with the OS. Serialised; last call wins. */
export function useReminderSync(): { sync: () => Promise<void>; lastError: Error | null };
```

Triggers (all call `sync()`):

- `usePlannerMutations` after every successful save (`onSuccess`).
- App start (after the document query first resolves).
- App resume (`onAppResume`) and `visibilitychange` → visible.
- Permission or exact-alarm state changes reported by `useReminderPermission`.
- Midnight tick from `useNow` (so the 14-day window slides).

Behaviour when permission is not `granted`: `sync()` still computes the plan but calls
`cancel` for everything pending and skips `schedule` (the OS would drop them anyway); the
banner explains why. When `remindersEnabled === false`: same, cancel everything.

## 5. Permission hook

```ts
export function useReminderPermission(): {
  permission: PermissionState;
  exactAlarm: ExactAlarmState;
  requestIfNeeded(): Promise<PermissionState>; // asks once, records permissionPromptShown
  refresh(): Promise<void>;                    // on start/resume
};
```
