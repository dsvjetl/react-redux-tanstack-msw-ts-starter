# Contract: UI additions for reminders

**Feature**: `002-task-reminders`. Extends feature 001's UI contract; accessible names below are
fixed for tests.

## Task editor sheet

| Field | Role / name | Behaviour |
|-------|-------------|-----------|
| Remind me | `combobox` "Remind me" (native `<select>`) with options in this order and exact text: "No reminder", "5 minutes before", "15 minutes before", "30 minutes before", "45 minutes before", "1 hour before" | Preselected from `preferences.defaultReminderMinutesBefore` on create, from the task/occurrence on edit. Disabled with helper text "Add a time to set a reminder" when Time is empty; keeps its value when Time is cleared. |

Save flow addition: if the saved task has a time and a reminder, and
`permissionPromptShown === false`, call `requestIfNeeded()` **before** persisting; persist
regardless of the answer. After persisting, if exact alarms are `denied` and
`exactAlarmPromptShown === false`, open the exact-alarm explanation dialog (below) once.

## Task detail dialog

| Element | Contract |
|---------|----------|
| Reminder line | Text "Reminds you 15 minutes before" / "Reminds you 1 hour before" / "No reminder", below the date and time line. Untimed occurrences show nothing. |

## Today header

| Control | Role / name | Behaviour |
|---------|-------------|-----------|
| Settings | `button` "Reminder settings" (gear icon) next to the remaining badge | Opens the Reminder settings sheet. |

## Reminder settings sheet (Radix Dialog, bottom-anchored)

| Element | Role / name | Contract |
|---------|-------------|----------|
| Title | `dialog` "Reminder settings" | |
| Switch | `switch` "Reminders" | Bound to `remindersEnabled`; toggling persists immediately and triggers sync. |
| Default | `combobox` "Default reminder" with the same six options | Bound to `defaultReminderMinutesBefore`. |
| Permission status | `status` text: "Notifications allowed" / "Notifications blocked" / "Notifications not requested yet" | |
| Permission action | `button` "Allow notifications" when `prompt`; `button` "Open notification settings" when `denied` | Calls `requestIfNeeded()` / `openNotificationSettings()`. |
| Exact alarms (Android 12+ only) | `status` "Exact timing on" / "Exact timing off"; `button` "Allow exact timing" when denied | Calls `openExactAlarmSettings()`. |
| Web note (web only) | Text "On the web, reminders only appear while this tab is open." | |
| Close | `button` "Close" | |

## Reminders banner (Today view, under the header)

| Condition | Role / text | Action |
|-----------|-------------|--------|
| `remindersEnabled === false` | `status` "Reminders are off" | `button` "Reminder settings" |
| permission `denied` | `alert` "Reminders are off because notifications are blocked. Enable them in system settings." | `button` "Open notification settings" |
| exact alarms `denied` (Android 14+) | `status` "Reminders may arrive a few minutes late" | `button` "Allow exact timing" |
| otherwise | not rendered | |

Only the most severe applicable row is shown, in the order listed.

## Exact-alarm explanation dialog (once)

`alertdialog` "Allow exact timing?" with body "Android needs your permission to deliver
reminders at the exact minute. Without it, reminders may arrive a few minutes late." and
buttons "Allow exact timing" (opens the system setting) and "Not now".

## Notification tap

Opens Today with the task's detail dialog (feature 001 dialog contract).

## Design tokens

No new tokens. The switch uses `--color-primary` for the on state; the banner uses
`--color-primary-soft` (status) or the existing `ErrorState` styling (alert).
