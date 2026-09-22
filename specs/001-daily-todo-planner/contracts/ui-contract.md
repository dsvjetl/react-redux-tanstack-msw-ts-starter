# Contract: UI routes, screens and accessible names

**Feature**: `001-daily-todo-planner`

Tests assert against these accessible names and states (Principle V), so they are fixed here
and must not drift during implementation. Copy is English only in this version.

## Routes

| Path | View | Notes |
|------|------|-------|
| `/` | Today | Default route. Always shows the real current day. |
| `/calendar` | Calendar | Week start comes from `calendarSlice`, remembered while the app is open. |
| `*` | redirect to `/` | No 404 page in an offline app. |

Bottom navigation: `<nav aria-label="Primary">` with links "Today" and "Calendar"; the active
link has `aria-current="page"`.

Android hardware back: close open sheet/dialog → else `navigate(-1)` → else exit app.

## Persistent controls

| Control | Role / name | Behaviour |
|---------|-------------|-----------|
| Floating add button | `button` "Add task" | Opens editor in create mode; date = today on Today, = tapped day on Calendar (FR-011). |

## Today screen

| Element | Role / name | Contract |
|---------|-------------|----------|
| Heading | `h1` = formatted date, e.g. "Monday, Sep 22" | Updates on midnight rollover via `useNow`. |
| Remaining badge | `status` named "N tasks remaining" via `aria-label`, visible text is the number (`aria-live="polite"`) | Counts undone in overdue + today. |
| Up next card | `region` "Up next" | Present only when FR-003 yields an occurrence. |
| Overdue group | `region` "Overdue" | Only when non-empty; each card shows original date; action `button` "Move to today". |
| Timeline | `list` "Today's schedule" | `listitem` per timed occurrence, ascending time. |
| Anytime group | `list` "Anytime" | Untimed occurrences, creation order. |
| Task card | `article` labelled by title | Contains `checkbox` "Mark {title} done"; sub-items as `checkbox` "{text}"; repeat badge `img` "Repeats {every day\|on weekdays\|weekly}". Activating the title opens the detail dialog. |
| Empty state | `region` "No tasks for today" with `button` "Add your first task" | When overdue and today are both empty. |

## Calendar screen

| Element | Role / name | Contract |
|---------|-------------|----------|
| Heading | `h1` "Schedule" | |
| Range chip | `status` e.g. "22 – 28 Sep" | |
| Week controls | `button` "Previous week", "Next week", "This week" | "This week" disabled when already on it. |
| Grid | `table` "Week schedule" | One `columnheader` per day, e.g. "Mon 22"; today's header has `aria-current="date"`. Rows: "Anytime" then hours "6 AM" … "11 PM". |
| Occurrence block | `button` "{title}, {time or Anytime}[, {n} sub-items][, repeats every day / on weekdays / weekly]" | Opens detail dialog. Badge shows `n` only when `n > 0`. Repeat rule is part of the name because children of a labelled button are not announced. |
| Add on a day | `button` "Add task on {Weekday, Mon d}" in each day's column header | Opens editor with that date (FR-011). One button per day rather than per cell keeps keyboard tab order short. |

## Task editor sheet (Radix Dialog, bottom-anchored)

| Field | Role / name | Validation message |
|-------|-------------|--------------------|
| Title | `textbox` "Title" (autofocus) | "Title is required" / "Keep the title under 120 characters" |
| Date | native date input labelled "Date" (no ARIA textbox role; query by label) | "Pick a date" |
| Time | native time input labelled "Time" (step 300) + `button` "Clear time" | "Use 5-minute steps" |
| Repeat | `radiogroup` "Repeat": "Does not repeat", "Every day", "Weekdays", "Weekly" | |
| Weekly days | `group` "Repeat on" with `checkbox` Mon…Sun | "Pick at least one day" |
| Sub-items | `list` "Sub-items", each `textbox` "Sub-item {i}" + `button` "Remove sub-item {i}"; `button` "Add sub-item" (disabled at 10) | "Sub-item text is required" / "Keep it under 80 characters" |
| Actions | `button` "Save", `button` "Cancel" | Save disabled while submitting. |

Editing an occurrence of a repeating task hides the Date field and, on Save, opens the
series-scope dialog.

## Dialogs

| Dialog | Role / name | Buttons |
|--------|-------------|---------|
| Task detail | `dialog` labelled by title | "Mark done"/"Mark not done", "Edit", "Delete", "End repeat" (repeating only), "Move to today" (overdue only), "Close" |
| Series scope | `alertdialog` "Apply to which occurrences?" | "This occurrence only", "This and all future occurrences", "Cancel" |
| Confirm delete | `alertdialog` "Delete this task?" | "Delete", "Cancel" |
| Confirm end repeat | `alertdialog` "Stop repeating?" | "End repeat", "Cancel" |

## Async states (FR-015)

| State | Contract |
|-------|----------|
| Loading | `status` "Loading your tasks" replaces list content; never longer than the first `load()`. |
| Error (corrupt storage) | `alert` "We couldn't load your saved tasks" with `button` "Dismiss"; app remains usable with an empty list. |
| Error (save failed) | `alert` "Couldn't save. Try again." after optimistic rollback. |
| Empty | See per-screen rows above. |

## Design tokens (names only; values set in `src/index.scss`)

`--color-bg`, `--color-surface`, `--color-primary`, `--color-primary-contrast`,
`--gradient-accent`, `--color-text`, `--color-text-muted`, `--color-border`, `--radius-card`,
`--radius-pill`, `--space-1..6`, `--shadow-card`, `--font-display`, `--font-body`,
`--motion-fast`, `--motion-base`, `--safe-top`, `--safe-bottom`.
