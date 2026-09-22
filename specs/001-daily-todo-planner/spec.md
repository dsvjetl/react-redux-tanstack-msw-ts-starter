# Feature Specification: Daily Todo Planner

**Feature Branch**: `001-daily-todo-planner`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "I want todo app in a sense where I could keep track of what I need to do today and in days ahead of me. Not like a calendar, but smaller tasks like "Make bed", "Brush your teeth", "Read a book", etc. I want to have a list where I can see my todos for today, and a calendar where I can see what I need to do in the next days in front of me. You can use template as a reference: spec/001-template-todo-design.png"

**Design reference**: `spec/001-template-todo-design.png` — three screens: a welcome splash, a
"Today" list (date header with remaining-task count, a highlighted "up next" card, a vertical
timeline of tasks with optional time and sub-items, a floating "+" button, bottom navigation
List / Calendar / Settings), and a "Schedule" week view (date-range chip, day columns, hour rows,
task blocks showing a sub-item count).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See and work through today's tasks (Priority: P1)

As a person planning my day, I open the app and immediately see today's date and every task I
have planned for today, ordered by time, so I can work through them and tick them off as I go.

**Why this priority**: This is the core daily loop. Without a usable "Today" list there is no
product; every other screen feeds into it.

**Independent Test**: With a handful of pre-existing tasks dated today, open the app and verify
the list shows only today's tasks in time order, the remaining-count badge is correct, and
marking a task done updates the list and the badge without a reload.

**Acceptance Scenarios**:

1. **Given** I have 4 tasks dated today (3 with a time, 1 without), **When** I open the app,
   **Then** I see today's date as the heading, a badge showing "4", the 3 timed tasks in
   ascending time order followed by the untimed task in an "Anytime" group.
2. **Given** the current time is 2:00 PM and I have tasks at 1 PM (done), 3 PM and 7 PM,
   **When** I view Today, **Then** the 3 PM task is shown as the highlighted "Up next" card at
   the top of the list.
3. **Given** a task is not done, **When** I mark it done, **Then** it is visually marked
   complete, the remaining-count badge decreases by one, and the task stays in the list in its
   place so I can undo the action.
4. **Given** I have no tasks for today, **When** I open Today, **Then** I see a friendly empty
   state that invites me to add my first task.
5. **Given** a task has sub-items (e.g. "Room clean: put the laundry, broom room floor"),
   **When** I view it in Today, **Then** the sub-items are listed under the task title and each
   can be ticked off individually; ticking all sub-items does not automatically complete the
   parent task.

---

### User Story 2 - Add, edit and remove tasks (Priority: P1)

As a person planning my day, I can quickly add a small task with a title, pick which day it
belongs to, optionally give it a time and a short list of sub-items, and later change or delete
it.

**Why this priority**: Viewing is worthless without a fast way to capture tasks. It is P1
alongside Story 1 because the MVP needs both to be useful, but Story 1 is listed first because
it defines what a task is displayed as.

**Independent Test**: From an empty Today list, tap "+", enter "Make bed", save, and verify it
appears in Today. Edit it to add a time and a sub-item and verify the list reflects the change.
Delete it and verify it disappears.

**Acceptance Scenarios**:

1. **Given** I am on the Today screen, **When** I tap the "+" button, **Then** an add-task form
   opens with the date pre-filled to today and focus in the title field.
2. **Given** the add-task form is open, **When** I enter a title and save without choosing a time,
   **Then** the task is created for the selected day as an untimed ("Anytime") task.
3. **Given** the add-task form is open, **When** I try to save with an empty title, **Then** the
   save is blocked and the title field shows an inline validation message.
4. **Given** the add-task form is open, **When** I set a date 3 days ahead and a time of 9:00 AM,
   **Then** the task does not appear in Today but appears in the Calendar on that day at 9 AM.
5. **Given** I open an existing task, **When** I change its title, date, time or sub-items and
   save, **Then** every screen that shows the task reflects the new values.
6. **Given** I open an existing task, **When** I choose delete and confirm, **Then** the task is
   removed from Today and the Calendar.
7. **Given** I add a task, **When** I close and reopen the app on the same device, **Then** the
   task is still there.

---

### User Story 3 - Look ahead in a calendar of upcoming days (Priority: P2)

As a person planning ahead, I switch to the Calendar view and see the next several days side by
side with the tasks placed on each day, so I can tell at a glance what is coming and add tasks
to future days.

**Why this priority**: Looking ahead is the second half of the user's request. It is P2 because
the app is already useful with Today alone, and the Calendar depends on tasks existing.

**Independent Test**: With tasks spread across today and the next 6 days, open Calendar and
verify each task appears in the correct day column at the correct time row, the date-range chip
matches the visible days, and navigating forward shows the following week.

**Acceptance Scenarios**:

1. **Given** I have tasks on today, tomorrow and 5 days from now, **When** I open Calendar,
   **Then** I see a week starting today, a date-range chip such as "22 – 28 Sep", one column per
   day, and each task shown as a block in its day column at its time.
2. **Given** a task has 3 sub-items, **When** I view it in Calendar, **Then** the block shows the
   task title and a small badge with "3".
3. **Given** a task has no time, **When** I view its day in Calendar, **Then** it appears in an
   "Anytime" area at the top of that day's column rather than at a time row.
4. **Given** I am viewing this week, **When** I navigate to the next week and back, **Then** the
   date-range chip and columns update accordingly and today's column is visually marked.
5. **Given** I tap an empty spot in a future day column, **When** the add-task form opens,
   **Then** the date is pre-filled to that day.
6. **Given** I tap a task block in Calendar, **When** the task detail opens, **Then** I can mark
   it done, edit it or delete it exactly as from Today.
7. **Given** a day has more tasks than fit in view, **When** I view that column, **Then** I can
   scroll within the column and no task is hidden.

---

### User Story 4 - Repeat daily habits (Priority: P2)

As a person with daily routines, I can set a task such as "Make bed" or "Brush your teeth" to
repeat every day, on weekdays, or on chosen days of the week, so it shows up automatically
without me re-adding it.

**Why this priority**: The user's own examples are habits, so repeating tasks are central to the
product's value. It is P2 because the app works without it (tasks can be re-added by hand), and
it depends on Stories 1 and 2 being in place.

**Independent Test**: Create "Brush your teeth" at 8:00 AM repeating every day. Verify it
appears in Today, in every day column of the Calendar for this and next week with a repeat
indicator, and that marking today's occurrence done leaves tomorrow's undone.

**Acceptance Scenarios**:

1. **Given** the add-task form is open, **When** I choose repeat "Every day" and save, **Then** the
   task appears in Today (if today is on or after its date) and on every day in the Calendar from
   its date onward, each with a repeat indicator.
2. **Given** I choose repeat "Weekly" and tick Monday and Thursday, **When** I save, **Then** the
   task appears only on Mondays and Thursdays in the Calendar.
3. **Given** I choose repeat "Weekly" and tick no days, **When** I try to save, **Then** the save is
   blocked and an inline message asks me to pick at least one day.
4. **Given** "Brush your teeth" repeats daily, **When** I mark today's occurrence done, **Then**
   today's badge decreases by one and tomorrow's occurrence is still shown as not done.
5. **Given** I open a future occurrence of a repeating task and change its time, **When** I save,
   **Then** I am asked "This occurrence only" or "This and all future occurrences", and only the
   chosen scope changes; occurrences before today are untouched.
6. **Given** I choose "End repeat" on a repeating task, **When** I confirm, **Then** occurrences up
   to today remain (with their done states) and no future occurrences are shown.
7. **Given** a daily task's occurrence from yesterday was not done, **When** I open Today,
   **Then** it does not appear in the Overdue group.

---

### User Story 5 - Keep overdue tasks visible (Priority: P3)

As a person who sometimes falls behind, tasks I did not finish on earlier days stay visible so I
can either finish them or move them to a later day.

**Why this priority**: This prevents silently losing tasks, but the app is fully usable without
it, so it comes after the core screens.

**Independent Test**: Create a one-off task dated yesterday and leave it undone. Open Today and
verify it appears in an "Overdue" group above today's tasks and can be rescheduled to today with
one action.

**Acceptance Scenarios**:

1. **Given** I have an undone one-off task dated yesterday, **When** I open Today, **Then** it is
   listed in an "Overdue" group above today's tasks, counted in the remaining badge, and
   labelled with its original date.
2. **Given** an overdue task is shown, **When** I choose "Move to today", **Then** its date
   becomes today and it moves into today's list.
3. **Given** I completed a task yesterday, **When** I open Today, **Then** it is not shown in
   Overdue.

---

### Edge Cases

- **Midnight rollover**: if the app is open when the date changes, the Today heading, list and
  badge update to the new day the next time the user interacts with the screen (or within one
  minute), and the previous day's undone tasks move to Overdue.
- **Two tasks at the same time**: both are shown, ordered by creation time, in both views.
- **Very long titles**: titles wrap to at most two lines in list cards and are truncated with an
  ellipsis in Calendar blocks; the full title is always visible in the task detail.
- **Many sub-items**: up to 10 sub-items per task; the form prevents adding an eleventh.
- **Task at 11:30 PM**: appears in the last hour row of its day; it never bleeds into the next
  day.
- **Storage unavailable or corrupted**: the app still opens with an empty list and shows a
  non-blocking message that previously saved tasks could not be loaded.
- **Switching views repeatedly**: the selected week in Calendar is remembered while the app is
  open; returning to Today always shows the actual current day.
- **Reduced motion / small screens**: all interactions work on a 360px-wide screen and with
  animations disabled.
- **Repeat rule changed from "Every day" to "Weekly: Mon"**: applied as "this and all future
  occurrences", so past daily occurrences and their done states are preserved while future days
  other than Monday no longer show the task.
- **Repeating task whose start date is in the past**: occurrences before today are shown in the
  Calendar when navigating back, but never in Overdue.
- **"This occurrence only" edit followed by a series edit**: the individually edited occurrence
  keeps its own values; the series change applies to all other future occurrences.
- **Far-future navigation**: occurrences are visible at least one year ahead when navigating the
  Calendar forward.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a "Today" view with the current date as the heading and a badge
  with the number of remaining (not done) tasks for today, including overdue tasks.
- **FR-002**: The Today view MUST list all tasks dated today, timed tasks first in ascending time
  order, then untimed tasks under an "Anytime" group.
- **FR-003**: The Today view MUST highlight the next undone timed task whose time is at or after
  the current time as an "Up next" card at the top; if none exists, no card is shown.
- **FR-004**: Users MUST be able to create a task with a required title (1–120 characters), a
  required date (defaulting to today), an optional time (in 5-minute steps), an optional repeat
  rule (see FR-017), and an optional ordered list of up to 10 sub-items (each 1–80 characters).
- **FR-005**: Users MUST be able to edit every field of an existing task and delete a task after
  a confirmation step.
- **FR-006**: Users MUST be able to mark a task done and undo that, and mark each sub-item done
  and undo that, from both the Today view and the task detail.
- **FR-007**: Completing all sub-items MUST NOT automatically complete the parent task, and
  completing the parent MUST NOT change sub-item states.
- **FR-008**: The system MUST show a "Calendar" view of 7 consecutive days starting from the first
  day of the currently selected week (default: today), with a date-range label, one column per
  day, hour rows from 6 AM to 11 PM, an "Anytime" area per day for untimed tasks, and today's
  column visually distinguished.
- **FR-009**: Each task in the Calendar MUST be placed in its day column at its time, show its
  title, and show a badge with its sub-item count when it has sub-items.
- **FR-010**: Users MUST be able to navigate the Calendar to the next and previous week and jump
  back to the current week.
- **FR-011**: Users MUST be able to open the add-task form from both views via a persistent "+"
  button; when opened from a Calendar day, the date MUST be pre-filled to that day.
- **FR-012**: Users MUST be able to switch between Today and Calendar via a persistent bottom
  navigation that indicates the active view.
- **FR-013**: The system MUST persist all tasks so they survive closing and reopening the app on
  the same device.
- **FR-014**: The system MUST show undone one-off tasks from past dates in an "Overdue" group at
  the top of Today, labelled with their original date, and MUST offer a one-step "Move to today"
  action.
- **FR-015**: Every view MUST provide explicit loading, empty and error states.
- **FR-016**: All actions MUST be operable by keyboard, and every interactive element MUST have an
  accessible name.
- **FR-017**: Users MUST be able to give a task a repeat rule of exactly one of: none (default),
  every day, weekdays (Monday–Friday), or weekly on one or more chosen days of the week. A weekly
  rule with no day selected MUST be rejected with an inline message.
- **FR-018**: A task with a repeat rule MUST produce one occurrence on every matching day from its
  start date onward, with no end date required. Each occurrence MUST have its own done state and
  its own sub-item done states; completing today's occurrence MUST NOT affect tomorrow's.
- **FR-019**: Occurrences of repeating tasks MUST appear in Today and Calendar exactly like one-off
  tasks, MUST carry a visible repeat indicator, and MUST NOT appear in the Overdue group (a
  missed occurrence is simply missed).
- **FR-020**: When a user edits or deletes an occurrence of a repeating task, the system MUST ask
  whether the change applies to "this occurrence only" or "this and all future occurrences", and
  MUST apply exactly that choice. Past occurrences MUST never be altered by a series change.
- **FR-021**: Users MUST be able to stop a repeat by choosing "End repeat" on a task, which keeps
  past occurrences and removes all future ones.
- **FR-022**: All task data MUST be stored on the current device only, for a single user. There
  MUST be no sign-up, sign-in, or cross-device sync in this version.

### Key Entities

- **Task**: A small thing to do. Attributes: title, start date, optional time, repeat rule (none,
  every day, weekdays, or weekly on chosen days), creation order, and an ordered list of zero or
  more Sub-items. A one-off task (repeat rule "none") has a single Occurrence on its date.
- **Occurrence**: One appearance of a Task on one specific day. Attributes: the day, done state,
  and the done state of each Sub-item for that day. Occurrences of a repeating task may carry
  their own overrides (title, time, sub-items) after a "this occurrence only" edit.
- **Sub-item**: A short checklist line belonging to one Task. Attributes: text, position within
  the task. Its done state is tracked per Occurrence.
- **Day view (Today)**: The set of occurrences falling on today plus undone one-off occurrences
  from earlier dates (Overdue). Not stored; derived from tasks and the current date.
- **Week view (Calendar)**: A window of 7 consecutive days and the occurrences falling inside it.
  Not stored; derived from tasks and the selected start day.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can add their first task and see it in Today within 30 seconds of
  opening the app, without instructions.
- **SC-002**: Adding a task with a title, time and two sub-items takes no more than 6 taps or
  key presses beyond typing the text.
- **SC-003**: Marking a task done reflects in the list and badge instantly (perceived as under
  100 ms) with no page reload.
- **SC-004**: With 200 tasks spread over 4 weeks, Today and Calendar each render fully within
  1 second on a mid-range phone.
- **SC-005**: 100% of tasks created are still present after closing and reopening the app on
  the same device.
- **SC-006**: In a usability check, 9 out of 10 first-time users correctly identify what they
  have to do today and what is planned for tomorrow within 10 seconds of seeing each screen.
- **SC-007**: All screens pass automated accessibility checks with zero critical issues, and every
  flow is completable with keyboard only.
- **SC-008**: Turning a one-off task into a daily habit takes no more than 3 taps or key presses
  beyond opening the task.

## Assumptions

- The app is a personal planner for one person; there is no sharing, assignment or
  collaboration on tasks.
- The welcome/"Register Now" splash in the design reference is treated as visual inspiration
  only. There are no accounts; if a welcome screen is built it is a one-time intro that leads
  straight into Today.
- "Small tasks" means short, checklist-style items; there are no durations, reminders,
  notifications, priorities, tags or attachments in this version.
- The Calendar shows a rolling 7-day window (not a month grid) because the user asked for "the
  next days in front of me", matching the day-column layout in the reference.
- Hour rows cover 6 AM to 11 PM; tasks outside this range are still allowed and are shown
  clamped to the first or last row with their actual time in the label.
- Dates and times use the device's local time zone and locale formatting.
- Overdue one-off tasks remain visible for 30 days after their date, after which undone tasks
  are still stored but no longer shown in the Overdue group.
- Repeat rules are limited to every day, weekdays, and weekly on chosen days. Monthly, yearly,
  "every N days" and end dates are out of scope; "End repeat" is the only way to stop a series.
- Missed occurrences of repeating tasks are not carried forward; a habit is either done on its
  day or not.
- Because data lives on one device only, clearing the browser's or device's site data removes
  all tasks; there is no backup, export or restore in this version.
- The "Settings" icon in the reference navigation is out of scope for this feature; the bottom
  navigation has Today and Calendar only.
- Visual style follows the reference: warm gradient accents, rounded cards, a bold primary
  colour for "Up next" and the "+" button, and clear day/time typography.
