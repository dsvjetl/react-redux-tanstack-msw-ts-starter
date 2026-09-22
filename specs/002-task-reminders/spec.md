# Feature Specification: Task Reminders

**Feature Branch**: `002-task-reminders`

**Created**: 2026-09-22

**Status**: Draft (amended 2026-09-22: lead-time options and chime per /speckit-plan input)

**Input**: User description: "Implement notifications when some event/todo will come"

**Builds on**: `specs/001-daily-todo-planner` (tasks, occurrences, repeat rules, Today and
Calendar views, task editor and detail dialog). Terms such as "occurrence", "one-off task" and
"repeating task" have the meaning defined there.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get reminded when a timed task is due (Priority: P1)

As a person planning my day, when a task I gave a time to comes up, my phone shows a
notification with the task's title so I do not forget it, even if the app is closed.

**Why this priority**: This is the whole point of the feature. Without a reminder that fires
outside the app, nothing else here has value.

**Independent Test**: Create a task for today at a time two minutes ahead, leave the app, and
verify a notification with the task title appears at that time. Tap it and verify the app
opens on that task's detail.

**Acceptance Scenarios**:

1. **Given** reminders are allowed on the device and a task "Read book" is set for today at
   3:00 PM with a reminder "5 minutes before", **When** the clock reaches 2:55 PM and the app is
   closed, **Then** a notification titled "Read book" appears with the body "In 5 minutes · 3 PM",
   playing the app's own soft chime.
2. **Given** a task has a reminder "15 minutes before" and is set for 3:00 PM, **When** the clock
   reaches 2:45 PM, **Then** the notification appears and its body says "In 15 minutes · 3 PM".
3. **Given** a notification for a task is showing, **When** I tap it, **Then** the app opens with
   that task's detail dialog on top of the Today view.
4. **Given** a task has sub-items, **When** its reminder fires, **Then** the notification body
   also lists up to the first three sub-items.
5. **Given** a task's time is in the past when I create or edit it, **When** I save, **Then** no
   reminder is scheduled for that occurrence and no error is shown.

---

### User Story 2 - Reminders follow the task (Priority: P1)

As a person who changes plans, reminders stay in sync with my tasks: marking a task done,
moving it, editing its time or deleting it means I am never reminded of something that no
longer applies.

**Why this priority**: A reminder for a task that was already done or deleted is worse than no
reminder; it trains the user to ignore notifications. This is inseparable from Story 1.

**Independent Test**: Create a task with a reminder two minutes ahead, mark it done, and verify
no notification appears. Repeat with edit-time, move-to-tomorrow, and delete.

**Acceptance Scenarios**:

1. **Given** a task with a pending reminder, **When** I mark its occurrence done, **Then** the
   reminder is cancelled and does not fire; marking it not done again restores the reminder if
   the time is still ahead.
2. **Given** a task with a pending reminder at 3:00 PM, **When** I change its time to 5:00 PM,
   **Then** the 3:00 PM reminder is cancelled and a 5:00 PM reminder is scheduled.
3. **Given** a task with a pending reminder, **When** I delete it (or, for a repeating task,
   delete "this occurrence only" or "this and all future occurrences"), **Then** every reminder
   for the removed occurrences is cancelled.
4. **Given** a repeating task with a reminder, **When** I change its time with "This and all
   future occurrences", **Then** only reminders from that day onward move; earlier days are
   unaffected.
5. **Given** an overdue one-off task, **When** I choose "Move to today", **Then** a reminder is
   scheduled for today only if its time is still ahead.
6. **Given** I clear a task's time (make it "Anytime"), **When** I save, **Then** its reminder is
   removed.

---

### User Story 3 - Choose when to be reminded (Priority: P2)

As a person with different kinds of tasks, I can pick how far ahead each task reminds me, and
set a default that new tasks start from, so quick chores remind me at the moment and things
that need preparation remind me earlier.

**Why this priority**: Fixed lead time works for many tasks, but the reference use cases
("Client meeting", "Read book") clearly want different notice. Comes after the core because the
default alone already delivers value.

**Independent Test**: Set the default lead time to 10 minutes, create a task, verify the editor
shows "10 minutes before" preselected; change one task to "1 hour before" and verify only that
task's reminder moves.

**Acceptance Scenarios**:

1. **Given** the task editor is open for a task with a time, **When** I look at the "Remind me"
   field, **Then** I can choose exactly: "No reminder", "5 minutes before", "15 minutes before",
   "30 minutes before", "45 minutes before", "1 hour before" (the Google Calendar style
   "N minutes before" model); the default selection is the app-wide default.
2. **Given** a task has no time, **When** I view the editor, **Then** the "Remind me" field is
   shown disabled with the hint "Add a time to set a reminder".
3. **Given** I open Reminder settings, **When** I change the default to "30 minutes before",
   **Then** tasks created afterwards start with that value and existing tasks keep their own.
4. **Given** I edit an occurrence of a repeating task and change "Remind me", **When** I choose
   "This and all future occurrences", **Then** the reminder lead time applies from that day on.
5. **Given** I chose "No reminder" for a task, **When** its time arrives, **Then** nothing is
   shown.

---

### User Story 4 - Control reminders app-wide and handle permission (Priority: P2)

As a person who sometimes wants quiet, I can turn all reminders off in one place, and the app
asks for permission to notify me only when I first need it, explaining what happens if I say
no.

**Why this priority**: Required for a respectful notification experience and for platform
permission rules, but it wraps the core behaviour rather than defining it.

**Independent Test**: With permission never granted, enable a reminder on a task and verify the
permission prompt appears; deny it and verify the in-app explanation and that tasks still save.
Turn the app-wide switch off and verify no notifications fire; turn it on and verify pending
reminders are restored.

**Acceptance Scenarios**:

1. **Given** the device has never been asked, **When** I save the first task with a reminder
   other than "No reminder", **Then** the device permission prompt appears once, before saving
   completes.
2. **Given** I denied permission, **When** I save a task with a reminder, **Then** the task is
   saved, the reminder choice is kept, and a non-blocking message says "Reminders are off
   because notifications are blocked. Enable them in system settings." with a button that opens
   the app's system settings.
3. **Given** Reminder settings, **When** I switch "Reminders" off, **Then** all pending reminders
   are cancelled immediately and no new ones are scheduled; the Today view shows a small
   "Reminders off" indicator.
4. **Given** reminders were off, **When** I switch them on, **Then** every upcoming occurrence
   with a reminder setting is scheduled again.
5. **Given** the device restarts, **When** the app next opens, **Then** reminders for upcoming
   occurrences are still delivered on time.

---

### Edge Cases

- **Reminder time already passed while editing**: saving a task whose reminder moment (time minus
  lead) is in the past but whose task time is still ahead schedules nothing for that occurrence;
  the task itself is unaffected.
- **Two reminders at the same minute**: both notifications are shown, each with its own title.
- **Repeating tasks far ahead**: reminders are scheduled only for occurrences within the next
  14 days and topped up each time the app opens or comes to the foreground, so a daily habit
  never runs out of reminders while the app is used at least once every two weeks.
- **Time zone change while travelling**: task times are local wall-clock times; reminders fire at
  the local wall-clock time in the current zone.
- **App killed before the reminder**: notifications are delivered by the device without the app
  running.
- **Lead time longer than the day**: "1 hour before" for a 12:30 AM task fires at 11:30 PM the
  previous day.
- **Ending a repeat**: all reminders after today are cancelled.
- **Storage corrupted on launch**: no reminders are scheduled from an empty document, and any
  previously scheduled reminders are cancelled to avoid orphans.
- **Web version**: reminders are delivered only while the app is open in the browser and
  notifications are allowed; the settings panel says so.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each task MUST carry a reminder setting: "none" or a lead time of exactly 5, 15,
  30, 45 or 60 minutes before the task's time. No other values exist. The setting MUST be
  editable in the task editor whenever the task has a time.
- **FR-002**: The system MUST keep an app-wide "Reminders" on/off switch and an app-wide default
  reminder setting, both persisted on the device, both editable from a Reminder settings panel
  reachable from the Today view.
- **FR-003**: For every upcoming occurrence whose task has a time and a reminder setting other
  than "none", while reminders are on and permission is granted, the system MUST schedule a
  device notification at `time − lead` in local time.
- **FR-004**: The notification MUST show the task title as its title; its body MUST start with
  "In N minutes" (or "In 1 hour") followed by " · " and the task time; when the task has
  sub-items, the body MUST append up to the first three sub-items on a new line.
- **FR-005**: Tapping a notification MUST open the app on the Today view with that occurrence's
  detail dialog open. If the occurrence no longer exists, the Today view opens without a dialog.
- **FR-006**: Any change that removes, moves or completes an occurrence (mark done, edit time,
  clear time, change date, delete, delete this occurrence, delete future, end repeat, series
  split, move to today) MUST cancel or reschedule the affected reminders in the same action, so
  no notification ever fires for an occurrence that is done, deleted or moved.
- **FR-007**: Marking a done occurrence as not done MUST restore its reminder when the reminder
  moment is still ahead.
- **FR-008**: Reminders for repeating tasks MUST be scheduled for occurrences within the next 14
  days and MUST be topped up every time the app starts or returns to the foreground.
- **FR-009**: The system MUST request notification permission at most once automatically, at the
  first save of a task with a reminder, and MUST otherwise never block saving a task on
  permission.
- **FR-010**: When permission is denied or reminders are switched off, tasks MUST keep their
  reminder settings so that reminders resume without user work once allowed again.
- **FR-011**: The Today view MUST show a small "Reminders off" indicator when the switch is off or
  permission is denied, linking to the Reminder settings panel.
- **FR-012**: Scheduled reminders MUST survive app restarts and device reboots.
- **FR-013**: Switching reminders off MUST cancel every pending reminder immediately; switching on
  MUST reschedule all eligible upcoming occurrences.
- **FR-014**: Reminder behaviour MUST be identical for one-off tasks and for each occurrence of a
  repeating task, including per-occurrence overrides.
- **FR-015**: Reminders MUST be automatic (opt-out): every new task with a time starts with the
  app-wide default reminder setting (initially "15 minutes before"), and a user turns reminders
  off for an individual task by choosing "No reminder". Existing tasks created before this
  feature MUST be given the app-wide default so they start reminding without re-editing.
- **FR-016**: Reminder notifications MUST play a distinct, soft, modern chime that ships with the
  app (not the device's default alert), and MUST otherwise respect the device's sound, vibration
  and Do Not Disturb settings. The chime MUST be under two seconds long.

### Key Entities

- **Reminder setting**: Part of a Task. One of `none`, `5`, `15`, `30`, `45`, `60` minutes
  before. Inherited by every occurrence unless a "this occurrence only" edit overrides it.
- **Reminder preferences**: App-wide, stored on the device. Attributes: reminders on/off
  (default on), default reminder setting, whether the permission prompt has been shown.
- **Scheduled reminder**: A device notification bound to one occurrence (task id + date).
  Attributes: fire moment, title, body. Derived from tasks and preferences; the app owns their
  lifecycle and never lets one outlive its occurrence.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a phone with the app closed, 99% of reminders appear within 60 seconds of their
  scheduled moment.
- **SC-002**: 100% of reminders for occurrences that were marked done, deleted, moved, or whose
  time changed are never shown at the old moment.
- **SC-003**: Changing a task's reminder takes no more than 2 taps in the editor beyond opening
  it.
- **SC-004**: Users who denied permission can still create and complete tasks with no extra
  steps; the explanation and the settings shortcut are visible within one tap of the Today view.
- **SC-005**: After a device reboot, reminders for the next 14 days are still delivered without
  reopening the app.
- **SC-006**: In a usability check, 9 out of 10 users correctly predict when a task will remind
  them after reading its "Remind me" value.

## Assumptions

- Reminders apply only to tasks with a time. Tasks in "Anytime" have no reminder; a daily
  morning summary of the day's tasks is out of scope for this feature.
- Overdue nudges (notifying again after the time has passed and the task is still undone) are
  out of scope.
- One reminder per occurrence; multiple reminders per task are out of scope.
- Reminder settings live on the device with the rest of the task data; there is still no
  account or sync.
- Sound, vibration and notification grouping follow the device defaults; the app does not
  offer its own sound settings in this version.
- Notifications are shown in the device's notification area and on the lock screen according
  to the user's system settings.
- On the web build, reminders are best-effort while the tab is open; the primary target for
  this feature is the Android app.
- The Reminder settings panel is a small sheet opened from a gear icon in the Today header; a
  full Settings screen remains out of scope.
- Lead-time options are fixed to 5, 15, 30, 45 and 60 minutes before; "at time of task" and
  custom minutes are out of scope, per the product owner's direction on 2026-09-22.
- The app-wide default reminder setting starts at "15 minutes before"; users who find automatic
  reminders noisy use the app-wide switch or set the default to "No reminder", which then makes
  new tasks opt-in.
- The chime is an original asset generated for the app, so there are no licensing constraints.
