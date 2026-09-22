# Quickstart: Task Reminders

**Feature**: `002-task-reminders` | See [plan.md](./plan.md), [data-model.md](./data-model.md),
[contracts/](./contracts/)

## Prerequisites

Everything from feature 001's quickstart, plus for device checks: an Android phone or emulator
on Android 13 or 14+ (to exercise both permission prompts), with the app installed via
Android Studio.

## Setup

```bash
nvm use
npm install                                    # adds @capacitor/local-notifications
python3 scripts/generate-chime.py              # regenerates both mellow_chime.wav copies (idempotent)
npm run cap:sync                               # copies web assets, updates the Android plugin list
```

## Run

```bash
npm run dev:mock     # FakeNotificationGateway; the settings sheet shows fake permission controls
npm run dev          # browser Notification API via the plugin's web implementation
npm run cap:open     # Android Studio → Run on device
```

## Quality gates

```bash
npm run lint && npm run typecheck && npm run test && npm run build && npm run scan:deadcode
```

## Automated validation (jsdom, fake gateway)

Covered by tests written first in each story's phase:

- `computeReminderPlan`: eligibility matrix (enabled flag, time, lead, done, deleted override,
  horizon, past `fireAt`, cap), sort order, id stability.
- `reconcileReminders`: empty pending, identical, changed body, changed time, unknown ids,
  idempotence.
- `formatReminderBody`: all five leads, sub-item truncation at three.
- Migration v1 → v2: tasks get 15, preferences defaulted, v2 round-trips, other versions
  corrupt.
- Commands: `setReminderPreferences` patch semantics; reminder fields flow through
  create/update/updateOccurrence (both scopes).
- `useReminderSync`: schedules after create, cancels after done/delete/disable, re-keys after
  a series split, tops up after a midnight tick, skips scheduling when permission is denied.
- Editor: option list, default preselection, disabled without time, permission prompt on
  first save only, save proceeds on denial.
- Settings sheet and banner: every row of the UI contract.
- Notification tap → Today + detail dialog; missing occurrence → Today only.

## Device validation (manual, Android)

### US1 - Fire on time

1. Set a task for 3 minutes ahead with "5 minutes before" → nothing fires (reminder moment
   already passed). Set one for 7 minutes ahead → a heads-up notification appears 2 minutes
   later titled with the task and body "In 5 minutes · h:mm", playing the mellow chime.
2. Kill the app from recents before the reminder → it still fires.
3. Tap the notification → app opens on Today with the task's detail dialog.
4. Task with 4 sub-items → body's second line lists the first three and "…".

### US2 - Stay in sync

5. Schedule a reminder 3 minutes ahead, mark done → nothing fires. Mark not done → fires.
6. Change the time to 10 minutes ahead → fires at the new moment only.
7. Delete the task → nothing fires. For a daily task: "this occurrence only" then "this and
   all future" → only the intended days are silent.
8. Overdue task → "Move to today" with a time still ahead → fires today.

### US3 - Lead time

9. Settings → Default reminder "30 minutes before" → new task editor preselects it; existing
   task unchanged.
10. Editor with no time → "Remind me" disabled with the helper text.

### US4 - App-wide control and permission

11. Fresh install: first save with a reminder shows the system notification prompt exactly
    once. Deny → task saved, banner "Reminders are off because notifications are blocked…",
    "Open notification settings" lands on the app's notification settings.
12. Android 14+: after allowing notifications, the "Allow exact timing?" dialog appears once;
    "Allow exact timing" opens the system screen; with it off the banner says reminders may be
    late and a reminder still arrives (possibly late).
13. Settings → Reminders off → pending notifications disappear from
    `adb shell dumpsys alarm | grep com.dava.todo`; on → they return.
14. Reboot the device with a reminder 10 minutes ahead → it still fires.

### Web

15. `npm run dev`, allow notifications, set a reminder 6 minutes ahead with "5 minutes
    before", keep the tab open → browser notification and the chime after 1 minute.
