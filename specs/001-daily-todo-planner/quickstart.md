# Quickstart: Daily Todo Planner

**Feature**: `001-daily-todo-planner` | See [plan.md](./plan.md), [data-model.md](./data-model.md),
[contracts/](./contracts/)

## Prerequisites

| Need | For | Check |
|------|-----|-------|
| Node ≥ 22 (`.nvmrc` = 23.4.0) | everything | `nvm use && node -v` |
| npm 10+ | everything | `npm -v` |
| JDK 21 | Android build | `java -version` |
| Android Studio Otter 2025.2.1+ with SDK 35 and an emulator or USB device | Android build | `echo $ANDROID_HOME` |

The web app, tests and lint need only Node. Android tooling is needed only for the last
section.

## Setup

```bash
nvm use
npm install
npm run prepare                      # Husky hooks
cp .env.example .env.local           # VITE_API_MOCK=false; set true to use the seeded in-memory store
```

## Run on the web

```bash
npm run dev          # http://localhost:5173, persists to localStorage via Capacitor Preferences web shim
npm run dev:mock     # same, but InMemoryTaskRepository seeded with tasks across this week
```

## Quality gates (merge gate per constitution)

```bash
npm run lint         # now covers .ts/.tsx (typescript-eslint)
npm run test         # Vitest, all colocated tests + domain unit tests
npm run build        # Vite production build → dist/ (mockServiceWorker.js removed)
npm run scan:deadcode
```

All four must exit 0.

## Package for Android

```bash
npm run build
npx cap sync android            # copies dist/ and updates plugins
npx cap open android            # opens Android Studio; Run ▶ on an emulator or device
# or headless:
cd android && ./gradlew assembleDebug && cd ..
```

The first time, `npx cap add android` generates `android/` (committed). `capacitor.config.ts`
must have the final `appId` before any Play Store upload.

## Validation scenarios

Each scenario maps to a spec user story; each is also encoded as tests that fail before the
story is implemented. Run them manually in `npm run dev:mock` unless noted.

### US1 - Today list (P1)

1. Open `/`. Expect the `h1` to be today's date and the "tasks remaining" badge to equal the
   number of undone seeded tasks for today plus overdue one-offs.
2. Timed tasks are in ascending time order under "Today's schedule"; untimed under "Anytime".
3. With the system clock at 14:00 and seeded tasks at 13:00 (done), 15:00, 19:00, the "Up next"
   region shows the 15:00 task. (Test: `vi.setSystemTime`.)
4. Tick "Mark … done" on a task: badge decreases by one immediately; the card stays in place.
5. Tick all sub-items of a task: the parent checkbox stays unchecked (FR-007).
6. Start with an empty store (`npm run dev` in a fresh browser profile): "No tasks for today"
   region with "Add your first task" button.

### US2 - Add, edit, delete (P1)

1. Press "Add task" on Today: sheet opens, Date prefilled with today, focus in Title.
2. Save with an empty title: "Title is required"; nothing saved.
3. Enter "Make bed", Save: card appears under "Anytime".
4. Edit it: set Time 08:00 and add sub-item "Fluff pillows": card moves to the timeline at 8 AM
   and shows the sub-item.
5. Set Date to 3 days ahead: it leaves Today and appears in Calendar on that day at 8 AM.
6. Delete → "Delete this task?" → Delete: gone from Today and Calendar.
7. Reload the page (web) or kill and relaunch the app (Android): tasks persist (SC-005).

### US3 - Calendar (P2)

1. Open `/calendar`: `h1` "Schedule", range chip "DD – DD Mon" starting today, 7 columns, today's
   header marked current.
2. A task with 3 sub-items shows badge "3" in its block; an untimed task appears in the
   "Anytime" row of its day.
3. "Next week" then "This week": range chip and columns update; "This week" becomes disabled.
4. Activate "Add task on …" in an empty future cell: editor opens with that date prefilled.
5. Activate an occurrence block: detail dialog opens with Mark done / Edit / Delete.
6. Seed 12 tasks on one day: the column scrolls and every block is reachable.

### US4 - Repeating habits (P2)

1. Create "Brush your teeth", 08:00, Repeat "Every day": it appears today and in every Calendar
   column this week and next, each with the "Repeats every day" badge.
2. Create "Gym", Repeat "Weekly", tick Mon and Thu: appears only in Mon/Thu columns.
3. Repeat "Weekly" with no days ticked, Save: "Pick at least one day".
4. Mark today's "Brush your teeth" done: tomorrow's occurrence is still undone (per-occurrence
   state).
5. Open a future occurrence, change time to 09:00, Save → "Apply to which occurrences?" →
   "This and all future occurrences": that day onward shows 09:00; earlier days keep 08:00 and
   their done states. (Unit test: series split in `plannerCommands.test.ts`.)
6. Detail → "End repeat" → confirm: occurrences up to today remain; none after today.
7. A daily task left undone yesterday does not appear under "Overdue".

### US5 - Overdue (P3)

1. Seed a one-off task dated yesterday, undone: it appears under "Overdue" with its date label
   and is counted in the badge.
2. "Move to today": it moves into today's list.
3. A one-off task completed yesterday does not appear in Overdue.

### Cross-cutting

- Keyboard only: Tab through Today, open the editor with Enter on "Add task", complete the
  form, Save, and close dialogs with Escape (FR-016, SC-007).
- Resize to 360 px wide: no horizontal page scroll; Calendar scrolls its own grid.
- OS "reduce motion" on: sheet opens without slide animation.
- Midnight rollover: set system time to 23:59:30, wait, or fire `visibilitychange`; the
  heading, list and badge move to the new day within a minute.
- Corrupt storage: in DevTools set `localStorage['CapacitorStorage.daily-todo-planner'] = '{'`
  and reload: app opens with an empty list and the "We couldn't load your saved tasks" alert.
- Android: hardware back closes an open sheet first, then navigates back, then exits.
