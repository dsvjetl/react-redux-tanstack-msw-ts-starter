---

description: "Task list for Daily Todo Planner implementation"
---

# Tasks: Daily Todo Planner

**Input**: Design documents from `/specs/001-daily-todo-planner/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (task-repository.md,
storage-schema.json, ui-contract.md), quickstart.md

**Tests**: Included. The constitution (Principle V) requires a colocated `<Name>.test.tsx` for
every component and at least one test per user story that fails before implementation. Write
each phase's tests first and confirm they fail.

**Organization**: Tasks are grouped by user story so each story is an independently testable
increment. Component folders follow the starter shape (`<Name>.tsx`, `<Name>.module.scss`,
`<Name>.test.tsx`, `index.ts`) and are created with `npm run generate` (Plop) from the parent
directory of `components/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5 from spec.md)
- Include exact file paths in descriptions

## Path Conventions

Single project, per plan.md: `src/views/<View>/` for pages, `src/shared/` for the shared task
domain and components, `src/store/` for Redux slices, `src/routing/`, `src/mocks/`, plus
`capacitor.config.ts` and `android/` at the repository root. Accessible names, roles and copy
come from `contracts/ui-contract.md`; field constraints from `data-model.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies, lint fix, token system, Capacitor config, test helpers, and removal
of starter example code.

- [X] T001 Add runtime dependencies `radix-ui`, `react-hook-form`, `@hookform/resolvers`, `zod`, `date-fns`, `motion`, `lucide-react`, `@capacitor/core`, `@capacitor/app`, `@capacitor/preferences`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/keyboard`, `@capacitor/haptics` and dev dependencies `@capacitor/cli`, `@capacitor/android`, `typescript-eslint`, `@testing-library/user-event` to `package.json` (latest 2026-09 versions per research.md R1, R6–R9, R12, R14) and run `npm install`
- [X] T002 Fix TypeScript linting in `eslint.config.js`: import `typescript-eslint`, add its recommended configs, change the main config's `files` to `['**/*.{js,jsx,ts,tsx}']`, set the parser for `.ts/.tsx`, add `**/*.test.{ts,tsx}` to the test-files block, set `settings.react.version` to `'detect'`; verify `npm run lint` reports on `src/App.tsx` (R14)
- [X] T003 [P] Delete starter examples `src/views/HomeExample/` (whole folder), `src/shared/components/HeaderExample/`, `src/store/todoSlice.ts`; set `src/mocks/handlers.ts` to export an empty `handlers` array; remove the `HeaderExample` import/usage from `src/App.tsx` and the `HomeExample` route from `src/routing/Routes.tsx` (leave a temporary `<Route path="/" element={<div />} />` until T021); reset `src/store/index.ts` to an empty `reducer: {}`
- [X] T004 [P] Define design tokens as CSS custom properties in `src/index.scss` (names from contracts/ui-contract.md "Design tokens": `--color-bg`, `--color-surface`, `--color-primary`, `--color-primary-contrast`, `--gradient-accent`, `--color-text`, `--color-text-muted`, `--color-border`, `--radius-card`, `--radius-pill`, `--space-1..6`, `--shadow-card`, `--font-display`, `--font-body`, `--motion-fast`, `--motion-base`, `--safe-top`, `--safe-bottom` using `env(safe-area-inset-*)`), keep the existing reset, set `body` background to `--color-bg`; create `src/assets/styles/_mixins.scss` with `card`, `focus-ring`, `visually-hidden` and `reduced-motion` mixins; verify primary-on-surface and text-on-bg contrast ≥ 4.5:1
- [X] T005 [P] Create `capacitor.config.ts` (`appId: 'com.example.dailytodoplanner'` placeholder flagged with a TODO comment, `appName: 'Daily Todo'`, `webDir: 'dist'`, `server.androidScheme: 'https'`, `plugins.SplashScreen.launchAutoHide: true`, `plugins.Keyboard.resize: 'body'`), add scripts `"cap:sync": "npm run build && npx cap sync android"` and `"cap:open": "npx cap open android"` to `package.json`, and add `android/app/build/`, `android/.gradle/`, `android/local.properties` to `.gitignore`
- [X] T006 [P] Create test helper `src/shared/utils/testing/renderWithProviders.tsx` exporting `renderWithProviders(ui, { repository?, preloadedState?, route? })` that wraps in a fresh `QueryClientProvider` (retries off), a Redux store from `src/store/index.ts` `setupStore(preloadedState)`, `MemoryRouter` at `route`, and a `TaskRepositoryProvider` (T016) defaulting to a new `InMemoryTaskRepository`; also export `userEvent.setup()` helper `user()`
- [X] T007 [P] Remove `'src/store'` from the `test.exclude` list in `vite.config.ts` so slice tests run (keep it in `coverage.exclude` only if desired), and add `'src/shared/utils/testing'` to both exclude lists
- [X] T008 [P] Create `knip.json` with `ignoreDependencies: ["axios"]` and `ignore: ["src/shared/services/ApiService.ts", "src/shared/utils/getApiBaseUrl.ts"]` plus a `// retained for future sync backend (plan.md Technical Context)` note in `README.md`'s Knip section; run `npm run scan:deadcode` and fix anything else reported after T003

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain models, recurrence expansion, the pure command reducer, storage
repository, query/mutation hooks, Redux UI slices, native wrappers, routing shell and the
shared async-state components. Every user story depends on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 [P] Create `src/shared/models/Task.ts` with Zod schemas and inferred types: `dateKeySchema` (`^\d{4}-\d{2}-\d{2}$` and a real calendar date), `timeKeySchema` (`HH:mm`, refine "minutes must be a multiple of 5"), `weekdaySchema` (int 1..7, 1 = Monday), `repeatRuleSchema` discriminated on `kind` (`'none' | 'daily' | 'weekdays' | 'weekly'`; weekly `days` non-empty, unique, refine message "Pick at least one day"), `subItemSchema` (`id` uuid, `text` trimmed 1–80 chars), `taskSchema` (`id`, `title` trimmed 1–120, `startDate`, `time: TimeKey | null`, `repeat`, `endDate: DateKey | null` refine `endDate >= startDate`, `subItems` max 10, `createdAt`/`updatedAt` ISO datetime), and `taskFormSchema`/`TaskInput` (`title`, `startDate`, `time`, `repeat`, `subItems: { id?: string; text: string }[]`) with the validation messages from contracts/ui-contract.md; add `src/shared/models/Task.test.ts` covering every rule above
- [X] T010 [P] Create `src/shared/models/Occurrence.ts` (`occurrenceStateSchema` `{ done: boolean; doneSubItemIds: string[] }`, `occurrenceOverrideSchema` `{ deleted?: true; title?; time?: TimeKey | null; subItems? }` with `minProperties: 1`, and the derived `Occurrence` type with `key, taskId, date, title, time, subItems, repeatKind, done, doneSubItemIds, isOverdue`) and `src/shared/utils/occurrenceKey.ts` (`makeOccurrenceKey(taskId, date)`, `parseOccurrenceKey(key)`), with `src/shared/utils/occurrenceKey.test.ts`
- [X] T011 [P] Create `src/shared/utils/date.ts` using `date-fns`: `toDateKey(date)`, `parseDateKey(key)`, `toTimeKey(date)`, `parseTimeKey(key)`, `addDaysToKey(key, n)`, `compareDateKeys`, `isoWeekday(key)`, `weekDays(startKey)` (7 keys), `formatDayHeading(key)` → "Monday, Sep 22", `formatColumnHeader(key)` → "Mon 22", `formatRangeLabel(start, end)` → "22 – 28 Sep" or "28 Sep – 4 Oct", `formatTimeLabel(timeKey)` → "8 AM" / "2:30 PM", `hourRowIndex(timeKey)` → `clamp(hour − 6, 0, 17)`; add `src/shared/utils/date.test.ts` including month-crossing ranges and clamping
- [X] T012 Create `src/shared/utils/occurrences.ts` implementing `matchesRule(rule, dateKey)`, `occurrencesInRange(doc, from, to)` exactly per data-model.md "Recurrence expansion" (bounds by `startDate`/`endDate`, skips `deleted` overrides, merges override fields, attaches state defaults `done: false`, `doneSubItemIds: []`, computes `isOverdue` for one-off tasks only given `today`), `sortOccurrences` (time then `createdAt`), and a 366-day range guard; add `src/shared/utils/occurrences.test.ts` covering none/daily/weekdays/weekly, `endDate`, overrides, deleted, and the guard (depends on T009–T011)
- [X] T013 Create `src/shared/models/PlannerDocument.ts`: `plannerDocumentSchema` v1 (`version: 1`, `tasks`, `occurrenceStates`, `overrides` keyed by occurrence key) matching `contracts/storage-schema.json`, `emptyDocument()`, `migrate(unknown)` (returns `{ status: 'ok' | 'corrupt'; doc }`), and `normalize(doc)` that drops state/override keys whose task id does not exist or whose date does not match the task's rule, and deletes state entries that are `done: false` with empty `doneSubItemIds`; add `src/shared/models/PlannerDocument.test.ts` (depends on T012)
- [X] T014 Create `src/shared/utils/plannerCommands.ts` exporting `PlannerCommand`, `SeriesScope`, `CommandContext`, `PlannerCommandError` (codes `TASK_NOT_FOUND`, `SCOPE_NOT_ALLOWED`, `INVALID_INPUT`) and pure `applyCommand(doc, cmd, ctx)` implementing all commands from `contracts/task-repository.md` with the post-conditions in data-model.md "Commands and state transitions": `createTask`, `updateTask` (one-off only; re-key state on date change), `updateOccurrence` scope `this` (upsert override) and `future` (series split: original `endDate = date − 1` or delete if before `startDate`; new task with new values, `startDate = date`, same `repeat`, inherited `endDate`; re-key states/overrides with date ≥ split date), `deleteTask`, `deleteOccurrence` (`this` → `{ deleted: true }`, `future` → truncate/delete), `endRepeat` (`endDate = today`, drop later states/overrides), `setOccurrenceDone`, `setSubItemDone` (independent per FR-007), `moveToToday` (one-off only); bump `updatedAt`; never mutate input; add `src/shared/utils/plannerCommands.test.ts` with a case per row of the transition table plus error cases (depends on T013)
- [X] T015 [P] Create the repository in `src/shared/services/taskRepository/`: `TaskRepository.ts` (interface + `LoadResult` union from contracts/task-repository.md), `InMemoryTaskRepository.ts` (constructor accepts an optional seed document, returns structured clones), `PreferencesTaskRepository.ts` (`@capacitor/preferences` key `daily-todo-planner`; on schema failure store the raw payload once under `daily-todo-planner.corrupt` and return `{ status: 'corrupt', doc: emptyDocument(), reason }`; `save` writes `JSON.stringify(doc)`), `index.ts` with `createTaskRepository()` choosing by `isMock` from `src/shared/utils/isMock.ts`; add `InMemoryTaskRepository.test.ts` and `PreferencesTaskRepository.test.ts` (mock `@capacitor/preferences` with `vi.mock`) covering empty, ok, corrupt and round-trip (depends on T013)
- [X] T016 [P] Create `src/shared/constants/queryKeys.ts` (`{ planner: 'planner' }`), `src/shared/services/taskRepository/TaskRepositoryContext.tsx` (`TaskRepositoryProvider`, `useTaskRepository()`), `src/shared/hooks/useTasks.ts` (`useQuery` on `[queryKeys.planner]` calling `repository.load()`, returning `{ doc, status: 'loading' | 'error' | 'ready', loadStatus }`), and `src/shared/hooks/usePlannerMutations.ts` (one `useMutation` per `PlannerCommand` type; `onMutate` applies `applyCommand` to the cached document with `ctx = { now: new Date(), newId: () => crypto.randomUUID() }`, `mutationFn` calls `repository.save(nextDoc)`, `onError` restores the snapshot and exposes `saveError`); add `useTasks.test.tsx` and `usePlannerMutations.test.tsx` using `renderWithProviders` (depends on T014, T015)
- [X] T017 [P] Create `src/shared/hooks/useNow.ts` returning a `Date` that refreshes every 30 s, on `document.visibilitychange`, and on Capacitor `App.addListener('appStateChange')` when native (guard with `Capacitor.isNativePlatform()`); add `src/shared/hooks/useNow.test.tsx` with `vi.useFakeTimers()` proving a tick and a visibility refresh
- [X] T018 [P] Create Redux slices: `src/store/calendarSlice.ts` (`weekStart: DateKey` initialised to today via `toDateKey`, reducers `nextWeek`, `previousWeek`, `goToThisWeek(today)`, `setWeekStart`), `src/store/taskEditorSlice.ts` (state `closed | { mode: 'create'; date: DateKey } | { mode: 'edit'; taskId: string; date: DateKey }`, reducers `openCreate(date)`, `openEdit({ taskId, date })`, `close`), `src/store/index.ts` exporting `setupStore(preloadedState?)`, `store`, `RootState`, `AppDispatch`, and `src/store/hooks.ts` with typed `useAppDispatch`/`useAppSelector`; add `calendarSlice.test.ts` and `taskEditorSlice.test.ts`
- [X] T019 [P] Create native wrappers in `src/shared/services/native/`: `backButton.ts` (`registerBackButton(handler)` using `@capacitor/app`, no-op on web), `haptics.ts` (`lightImpact()` using `@capacitor/haptics`, no-op on web), `appearance.ts` (`initAppearance()` sets status bar style/overlay and hides the splash screen, no-op on web); call `initAppearance()` from `src/main.tsx` after render
- [X] T020 [P] Generate shared async-state components with Plop in `src/shared/components/`: `LoadingState` (`role="status"`, text "Loading your tasks"), `EmptyState` (props `title`, `actionLabel?`, `onAction?`; `role="region"` labelled by title), `ErrorState` (`role="alert"`, props `message`, `onDismiss?` rendering `button` "Dismiss"); each with `.module.scss` using tokens and a colocated test
- [X] T021 Wire routing and shell: set `src/routing/routePaths.ts` to `{ TODAY: '/', CALENDAR: '/calendar' }`; `src/routing/Routes.tsx` renders `Today` at `TODAY`, `Calendar` at `CALENDAR`, and `<Navigate to={routePaths.TODAY} replace />` for `*` (use placeholder `<div>` views until Phases 3 and 5 replace them); create `src/shared/components/BottomNav/` (`nav aria-label="Primary"`, `NavLink`s "Today" and "Calendar" with `aria-current="page"`, lucide icons) and `src/shared/components/AppShell/` (safe-area padded layout, `BottomNav`, `Outlet`/children slot, effect calling `registerBackButton` that closes an open editor/dialog via `taskEditorSlice.close`, else `navigate(-1)` when `window.history.length > 1`, else `App.exitApp()`); update `src/App.tsx` to compose `BrowserRouter` → `QueryClientProvider` → `Provider` → `TaskRepositoryProvider value={createTaskRepository()}` → `AppShell` → `AppRoutes`, and keep `ReactQueryDevtools` only when `import.meta.env.DEV`; add `BottomNav.test.tsx` and `AppShell.test.tsx` (depends on T016–T020)
- [X] T022 [P] Create `src/mocks/seedTasks.ts` exporting `createSeedDocument(today: DateKey)` with: a done 13:00 one-off task today, undone 15:00 and 19:00 one-off tasks today (one with 2 sub-items), an untimed task today, a "Brush your teeth" 08:00 daily task started 10 days ago, a "Gym" weekly Mon/Thu task, a 3-sub-item task 2 days ahead, an untimed task 4 days ahead, and an undone one-off task dated yesterday; use it in `createTaskRepository()` when `isMock` is true (depends on T015)

**Checkpoint**: `npm run test`, `npm run lint`, `npm run build` and `npm run scan:deadcode` pass; `npm run dev:mock` shows the shell with bottom navigation and two placeholder routes.

---

## Phase 3: User Story 1 - See and work through today's tasks (Priority: P1) 🎯 MVP

**Goal**: The Today view shows today's date, a remaining-count badge, the "Up next" card, timed
tasks in order, anytime tasks, sub-item checklists, and lets the user tick tasks and sub-items
done.

**Independent Test**: With the seeded in-memory repository and the clock fixed at 14:00, render
`/`; the heading is today's date, the badge counts undone tasks, the 15:00 task is "Up next",
timed tasks are ordered, marking done updates the badge, and ticking all sub-items leaves the
parent unchecked. With an empty repository the empty state appears.

### Tests for User Story 1

- [X] T023 [P] [US1] Write `src/views/Today/Today.test.tsx` with failing tests for spec US1 scenarios 1–5 and the quickstart US1 checks: heading text via `formatDayHeading`, `status` "N tasks remaining", ordering under list "Today's schedule" then list "Anytime", `region` "Up next" holds the 15:00 task at 14:00 (`vi.setSystemTime`) and is absent when nothing remains, `checkbox` "Mark {title} done" decrements the badge and keeps the card in place, ticking every sub-item checkbox leaves the parent unchecked, empty repository renders `region` "No tasks for today" with `button` "Add your first task", loading renders `status` "Loading your tasks", corrupt repository renders `alert` "We couldn't load your saved tasks"

### Implementation for User Story 1

- [X] T024 [P] [US1] Create `src/views/Today/hooks/useTodayOccurrences.ts` returning `{ overdue, timed, anytime, upNext, remainingCount, status, loadStatus }` per data-model.md "Today view" (overdue = one-off, `date < today`, within 30 days, undone; `upNext` = first undone timed with `time >= nowTime`; `remainingCount` = undone in overdue ∪ today) using `useTasks` and `useNow`; add `src/views/Today/hooks/useTodayOccurrences.test.ts`
- [X] T025 [P] [US1] Create `src/shared/components/SubItemChecklist/` rendering a `list` of `radix-ui` `Checkbox` items named by sub-item text, `checked` from `doneSubItemIds`, `onToggle(subItemId, done)`; tokens for spacing; colocated test
- [X] T026 [P] [US1] Create `src/shared/components/TaskCard/` (`article` labelled by title; time label; `Checkbox` "Mark {title} done"; `SubItemChecklist`; title rendered as a `button` that calls `onOpen`; `variant: 'default' | 'upNext' | 'overdue'`; title wraps to max 2 lines via CSS; calls `lightImpact()` on done) with `TaskCard.module.scss` and a colocated test (depends on T025)
- [X] T027 [P] [US1] Create `src/views/Today/components/TodayHeader/` (`h1` = `formatDayHeading(today)`, `span role="status" aria-live="polite"` "N tasks remaining" styled as the pink pill badge) with test
- [X] T028 [P] [US1] Create `src/views/Today/components/UpNextCard/` (`section role="region" aria-label="Up next"`, gradient `--gradient-accent` card showing title, time and sub-items, reuses `TaskCard` with `variant="upNext"`, `motion` fade-in guarded by `useReducedMotion`) with test
- [X] T029 [P] [US1] Create `src/views/Today/components/TaskTimeline/` (`ul aria-label="Today's schedule"`, each `li` shows a time pill on a vertical rail plus a `TaskCard`) with test
- [X] T030 [P] [US1] Create `src/views/Today/components/AnytimeGroup/` (`h2` "Anytime", `ul aria-label="Anytime"` of `TaskCard`s) with test
- [X] T031 [US1] Implement `src/views/Today/Today.tsx` (+ `Today.module.scss`, `index.ts`): compose `TodayHeader`, `UpNextCard`, `TaskTimeline`, `AnytimeGroup`; render `LoadingState` while `status === 'loading'`, `ErrorState` "We couldn't load your saved tasks" when `loadStatus === 'corrupt'` (dismissible, list still renders), `EmptyState` "No tasks for today" / "Add your first task" when both overdue and today are empty; wire `setOccurrenceDone` and `setSubItemDone` from `usePlannerMutations`; show `ErrorState` "Couldn't save. Try again." on `saveError`; replace the placeholder in `src/routing/Routes.tsx`; make T023 pass (depends on T024–T030)

**Checkpoint**: User Story 1 is fully functional with seeded data; `npm run dev:mock` shows the reference-style Today screen.

---

## Phase 4: User Story 2 - Add, edit and remove tasks (Priority: P1)

**Goal**: A floating "Add task" button opens a bottom-sheet editor (title, date, time, repeat
rule, sub-items) that creates or edits tasks; a detail dialog marks done, edits or deletes; data
survives reload.

**Independent Test**: From an empty repository press "Add task", save "Make bed", see it under
"Anytime"; edit it to 08:00 with a sub-item and see it in the timeline; delete it and see the
empty state; re-render with the same repository instance and confirm the task persisted.

### Tests for User Story 2

- [X] T032 [P] [US2] Write `src/shared/components/TaskEditorSheet/TaskEditorSheet.test.tsx` with failing tests: opens with Date prefilled and focus in `textbox` "Title"; empty title shows "Title is required"; 121-char title shows "Keep the title under 120 characters"; time `08:03` shows "Use 5-minute steps"; "Add sub-item" disabled after 10; sub-item over 80 chars shows "Keep it under 80 characters"; Save calls `createTask` with the normalised `TaskInput`; Cancel and Escape close without saving; edit mode prefills all fields and calls `updateTask`
- [X] T033 [P] [US2] Write `src/shared/components/TaskDetailDialog/TaskDetailDialog.test.tsx` with failing tests: dialog labelled by title shows date, time and sub-items; "Mark done"/"Mark not done" toggles; "Edit" dispatches `openEdit`; "Delete" opens `alertdialog` "Delete this task?" and confirming calls `deleteTask`; "Close" closes
- [X] T034 [P] [US2] Extend `src/views/Today/Today.test.tsx` with failing flows for spec US2 scenarios 1–7: FAB opens the editor with today's date, saving "Make bed" shows it under "Anytime", editing to 08:00 moves it into "Today's schedule", date 3 days ahead removes it from Today, delete removes it, and a second `renderWithProviders` with the same `InMemoryTaskRepository` still shows it

### Implementation for User Story 2

- [X] T035 [P] [US2] Create `src/shared/components/FloatingAddButton/` (`button aria-label="Add task"` with lucide `Plus`, fixed bottom-right above `BottomNav` using `--safe-bottom`; `onClick` dispatches `openCreate(date)` where `date` comes from a prop) with test
- [X] T036 [P] [US2] Create `src/shared/components/ConfirmDialog/` wrapping `radix-ui` `AlertDialog` (props `open`, `title`, `description?`, `confirmLabel`, `onConfirm`, `onCancel`; renders `button` `confirmLabel` and `button` "Cancel") with test
- [X] T037 [P] [US2] Create `src/shared/components/RepeatRulePicker/` (`radiogroup` "Repeat" with "Does not repeat", "Every day", "Weekdays", "Weekly"; when Weekly, `group` "Repeat on" with `checkbox` Mon…Sun; value/onChange typed as `RepeatRule`; shows "Pick at least one day" from the passed error) with test
- [X] T038 [US2] Create `src/shared/components/TaskEditorSheet/` : `radix-ui` `Dialog` anchored to the bottom (`Dialog.Content` styled as a sheet with drag handle look, `motion` slide-up guarded by `useReducedMotion`, `AnimatePresence` for exit), `useForm<TaskInput>` with `zodResolver(taskFormSchema)`, fields per contracts/ui-contract.md "Task editor sheet" (Title autofocus, Date native `type="date"`, Time native `type="time" step={300}` + `button` "Clear time", `RepeatRulePicker`, sub-items `list` "Sub-items" with `useFieldArray`, "Add sub-item" disabled at 10, "Remove sub-item {i}"), reads `taskEditorSlice` for mode/date/taskId (edit mode prefills from `useTasks().doc`), Save → `createTask` or `updateTask` then `close`, Cancel → `close`; `TaskEditorSheet.module.scss`; make T032 pass (depends on T036, T037)
- [X] T039 [US2] Create `src/shared/components/TaskDetailDialog/` (`radix-ui` `Dialog` labelled by the occurrence title; shows date, time or "Anytime", `SubItemChecklist`; buttons "Mark done"/"Mark not done", "Edit" (dispatch `openEdit`, close), "Delete" (via `ConfirmDialog` "Delete this task?" → `deleteTask`), "Close"; open state held in local component state exposed through a small `useTaskDetail()` context in `src/shared/components/TaskDetailDialog/TaskDetailContext.tsx`) with `.module.scss`; make T033 pass (depends on T036)
- [X] T040 [US2] Mount `TaskEditorSheet` and `TaskDetailDialog` (with its provider) once inside `src/shared/components/AppShell/AppShell.tsx`; in `src/views/Today/Today.tsx` render `FloatingAddButton date={today}`, make `EmptyState`'s "Add your first task" dispatch `openCreate(today)`, and make `TaskCard` `onOpen` open the detail dialog; update the back-button handler in `AppShell` to close the detail dialog too; make T034 pass (depends on T038, T039)

**Checkpoint**: Users can create, edit, complete and delete tasks that persist; US1 + US2 form the MVP.

---

## Phase 5: User Story 3 - Look ahead in a calendar of upcoming days (Priority: P2)

**Goal**: A 7-day Schedule grid with a range chip, day columns, hour rows 6 AM–11 PM, an
Anytime row, sub-item count badges, week navigation, tap-to-add on empty cells and tap-to-open
on blocks.

**Independent Test**: With seeded tasks on today, +2 and +4 days, render `/calendar`; the range
chip starts today, blocks sit in the right day column and hour row, the 3-sub-item task shows
badge "3", "Next week" then "This week" updates the chip, tapping an empty cell opens the editor
with that date, tapping a block opens the detail dialog.

### Tests for User Story 3

- [X] T041 [P] [US3] Write `src/views/Calendar/Calendar.test.tsx` with failing tests for spec US3 scenarios 1–7: `h1` "Schedule", `status` range label from `formatRangeLabel`, `table` "Week schedule" with 7 `columnheader`s and today's header `aria-current="date"`, block `button` "{title}, {time}, 3 sub-items" in the correct column/row, untimed block in the "Anytime" row, `button` "Next week"/"This week" behaviour and disabled state, `button` "Add task on {weekday date}" opens the editor with that date (assert `taskEditorSlice` state), clicking a block opens the detail dialog, 12 tasks on one day are all present
- [X] T042 [P] [US3] Write `src/views/Calendar/hooks/useWeekOccurrences.test.ts` with failing tests for grouping by day, `anytime` vs `timed` split, sort order, `rangeLabel`, `isToday`, and the 366-day guard

### Implementation for User Story 3

- [X] T043 [P] [US3] Create `src/views/Calendar/hooks/useWeekOccurrences.ts` returning `{ days: DateKey[], byDay: Record<DateKey, { anytime: Occurrence[]; timed: Occurrence[] }>, rangeLabel, isToday(date), status, loadStatus }` from `useTasks`, `useNow` and `calendarSlice.weekStart`; make T042 pass
- [X] T044 [P] [US3] Create `src/views/Calendar/components/WeekHeader/` (`h1` "Schedule", `span role="status"` range chip, `button`s "Previous week", "Next week", "This week" (disabled when `weekStart === today`) dispatching `calendarSlice` actions) with test
- [X] T045 [P] [US3] Create `src/views/Calendar/components/OccurrenceBlock/` (`button` named "{title}, {formatTimeLabel(time) | 'Anytime'}, {n} sub-items" (omit the count segment when 0), white rounded card with truncated title and a pink count badge when `n > 0`, repeat-aware styling hook for US4) with test
- [X] T046 [P] [US3] Create `src/views/Calendar/components/AnytimeRow/` (row header "Anytime", one cell per day containing `OccurrenceBlock`s) with test
- [X] T047 [P] [US3] (merged into `WeekGrid` hour rows for table semantics; one "Add task on …" button per day header instead of per cell) Create `src/views/Calendar/components/DayColumn/` (18 hour cells for a day; each empty cell has a visually-hidden `button` "Add task on {formatDayHeading(date)}" plus click target; timed blocks placed with `grid-row: hourRowIndex(time) + 1`; column scrolls vertically when content overflows) with test
- [X] T048 [US3] Create `src/views/Calendar/components/WeekGrid/` (`table role="table" aria-label="Week schedule"` semantics over a CSS grid: `columnheader` per day via `formatColumnHeader`, today's header `aria-current="date"`, `rowheader`s "Anytime", "6 AM" … "11 PM", composes `AnytimeRow` and 7 `DayColumn`s; horizontal scroll container showing 3 columns at 360 px with today scrolled into view) with test (depends on T045–T047)
- [X] T049 [US3] Implement `src/views/Calendar/Calendar.tsx` (+ `.module.scss`, `index.ts`): compose `WeekHeader`, `WeekGrid`, `FloatingAddButton date={weekStart}`; loading/corrupt/save-error states as in Today; `OccurrenceBlock` opens the detail dialog; empty-cell buttons dispatch `openCreate(date)`; replace the placeholder in `src/routing/Routes.tsx`; make T041 pass (depends on T043, T044, T048)

**Checkpoint**: Today and Calendar both work; the editor and detail dialog are shared.

---

## Phase 6: User Story 4 - Repeat daily habits (Priority: P2)

**Goal**: Repeating tasks show a repeat badge, complete per occurrence, can be edited or deleted
for "this occurrence only" or "this and all future occurrences", can be ended, and never appear
in Overdue.

**Independent Test**: Create "Brush your teeth" 08:00 every day; it appears today and in every
Calendar column for two weeks with the badge; marking today's done leaves tomorrow's undone;
editing a future occurrence's time with "This and all future occurrences" changes only that day
onward; "End repeat" removes future occurrences; yesterday's undone occurrence is not in
Overdue.

### Tests for User Story 4

- [X] T050 [P] [US4] Write `src/shared/components/SeriesScopeDialog/SeriesScopeDialog.test.tsx` with failing tests: `alertdialog` "Apply to which occurrences?" with buttons "This occurrence only", "This and all future occurrences", "Cancel" invoking `onChoose('this' | 'future')` / `onCancel`
- [X] T051 [P] [US4] Extend `src/views/Today/Today.test.tsx` and `src/views/Calendar/Calendar.test.tsx` with failing flows for spec US4 scenarios 1–7: daily task shows `img` "Repeats every day" today and in all 14 columns across two weeks; weekly Mon/Thu appears only in those columns; weekly with no days shows "Pick at least one day"; marking today's occurrence done leaves tomorrow undone; editing a future occurrence's time and choosing "This and all future occurrences" changes only that day onward (earlier days keep 08:00 and done states); "End repeat" then confirm removes future occurrences; yesterday's undone daily occurrence is absent from "Overdue"

### Implementation for User Story 4

- [X] T052 [P] [US4] Create `src/shared/components/SeriesScopeDialog/` wrapping `radix-ui` `AlertDialog` per contracts/ui-contract.md "Series scope"; make T050 pass
- [X] T053 [P] [US4] Add the repeat badge to `src/shared/components/TaskCard/TaskCard.tsx` and `src/views/Calendar/components/OccurrenceBlock/OccurrenceBlock.tsx`: lucide `Repeat` icon with `role="img"` and `aria-label` "Repeats every day" / "Repeats on weekdays" / "Repeats weekly" based on `repeatKind`; update both component tests
- [X] T054 [US4] Update `src/shared/components/TaskEditorSheet/TaskEditorSheet.tsx`: when editing an occurrence of a task with `repeat.kind !== 'none'`, hide the Date field, and on Save open `SeriesScopeDialog`; on "This occurrence only" call `updateOccurrence` with `scope: 'this'` (title, time, sub-items only), on "This and all future occurrences" call `updateOccurrence` with `scope: 'future'` (including any repeat change); update `TaskEditorSheet.test.tsx` (depends on T052)
- [X] T055 [US4] Update `src/shared/components/TaskDetailDialog/TaskDetailDialog.tsx`: show "End repeat" for repeating tasks (opens `ConfirmDialog` "Stop repeating?" with "End repeat" → `endRepeat`); on "Delete" for a repeating task open `SeriesScopeDialog` and call `deleteOccurrence` with the chosen scope instead of `deleteTask`; show the repeat badge; update `TaskDetailDialog.test.tsx` (depends on T052)
- [X] T056 [US4] Confirm per-occurrence completion and Overdue exclusion end to end: verify `useTodayOccurrences` excludes repeating occurrences from `overdue`, `setOccurrenceDone` keys by `${taskId}:${date}`, and make T051 pass; fix any gaps in `src/shared/utils/occurrences.ts` or `src/shared/utils/plannerCommands.ts` with added unit cases (depends on T053–T055)

**Checkpoint**: Habits repeat correctly with per-day completion and safe series edits.

---

## Phase 7: User Story 5 - Keep overdue tasks visible (Priority: P3)

**Goal**: Undone one-off tasks from the last 30 days appear in an "Overdue" group at the top of
Today with their original date, count toward the badge, and can be moved to today in one step.

**Independent Test**: Seed an undone one-off task dated yesterday and a done one dated
yesterday; only the undone one appears under "Overdue" labelled with its date and is counted in
the badge; "Move to today" moves it into today's list.

### Tests for User Story 5

- [X] T057 [P] [US5] Extend `src/views/Today/Today.test.tsx` with failing tests for spec US5 scenarios 1–3: `region` "Overdue" lists the undone yesterday task with its `formatDayHeading` label and the badge includes it; `button` "Move to today" moves it into "Today's schedule"/"Anytime"; a task completed yesterday is absent; a task 31 days old is absent

### Implementation for User Story 5

- [X] T058 [P] [US5] Create `src/views/Today/components/OverdueGroup/` (`section role="region" aria-label="Overdue"`, `h2` "Overdue", list of `TaskCard variant="overdue"` each with an original-date label and `button` "Move to today" calling `onMoveToToday(taskId)`) with test
- [X] T059 [US5] Wire `OverdueGroup` into `src/views/Today/Today.tsx` above `UpNextCard` using `overdue` from `useTodayOccurrences`, call `moveToToday` from `usePlannerMutations`; add "Move to today" to `src/shared/components/TaskDetailDialog/TaskDetailDialog.tsx` when `isOverdue`; make T057 pass (depends on T058)

**Checkpoint**: All five user stories are independently functional.

---

## Phase 8: Polish, Cross-Cutting Concerns & Android Packaging

**Purpose**: Edge cases from spec.md, accessibility and responsiveness, documentation, and the
Capacitor Android build.

- [X] T060 [P] Add midnight-rollover coverage: test in `src/views/Today/Today.test.tsx` that advancing fake timers from 23:59:30 across midnight (plus a `visibilitychange` event) updates the heading, list and badge, and moves yesterday's undone one-off task into "Overdue"; fix `src/shared/hooks/useNow.ts` if needed
- [X] T061 [P] Add two-tasks-same-time and 23:30 edge-case tests to `src/shared/utils/occurrences.test.ts` and `src/shared/utils/date.test.ts` (same-time ordered by `createdAt`; 23:30 maps to the last hour row and stays on its day)
- [X] T062 [P] Accessibility and responsiveness pass: add `:focus-visible` rings via the `focus-ring` mixin to every interactive component's `.module.scss`, ensure all icon-only buttons have `aria-label`, wrap all `motion` usage with `useReducedMotion`, verify no horizontal page scroll at 360 px in `src/views/Today/Today.module.scss` and `src/views/Calendar/Calendar.module.scss`; add a keyboard-only flow test in `src/shared/components/AppShell/AppShell.test.tsx` (Tab to "Add task", Enter, fill, Save, Escape closes dialogs)
- [X] T063 [P] Add a corrupt-storage end-to-end test in `src/shared/services/taskRepository/PreferencesTaskRepository.test.ts` and `src/views/Today/Today.test.tsx` (payload `'{'` → empty list + `alert` "We couldn't load your saved tasks" + payload copied to `daily-todo-planner.corrupt` exactly once)
- [X] T064 [P] Update `README.md`: replace the starter "Example files" section with a "Daily Todo Planner" overview, document `dev:mock` seeding, the new `cap:sync`/`cap:open` scripts, Android prerequisites (Node ≥ 22, JDK 21, Android Studio Otter 2025.2.1+), and link `specs/001-daily-todo-planner/`
- [X] T065 Run the merge gate locally and fix everything reported: `npm run lint`, `npm run test`, `npm run build`, `npm run scan:deadcode`; confirm `dist/` contains no `mockServiceWorker.js` and the gzipped JS bundle is ≤ 300 KB (plan.md Performance Goals)
- [ ] T066 (PARTIAL: `npx cap add android` and `npm run cap:sync` done and `android/` generated; the Gradle build and on-device checks are blocked because this machine has no JDK 21 / Android Studio) Add the Android platform: run `npx cap add android` to generate `android/`, commit it, run `npm run cap:sync`, open in Android Studio (`npm run cap:open`) or `cd android && ./gradlew assembleDebug`, and verify on an emulator or device: app launches to Today, tasks persist across kill/relaunch (Preferences), hardware back closes the sheet then navigates then exits, keyboard does not cover the editor, status bar and splash screen configured in `capacitor.config.ts` (depends on T065; requires JDK 21 + Android Studio per quickstart.md)
- [ ] T067 (PARTIAL: web scenarios are covered by the automated suite (158 tests) and by headless-Chrome screenshots of Today and Calendar in `npm run dev:mock`; Android scenarios blocked with T066) Execute every scenario in `specs/001-daily-todo-planner/quickstart.md` (web via `npm run dev:mock`, Android via T066), record results in `specs/001-daily-todo-planner/checklists/requirements.md` Notes, and confirm the `appId` in `capacitor.config.ts` before any store upload (depends on T066)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 first (installs packages); T002–T008 after T001, all parallel
- **Foundational (Phase 2)**: depends on Phase 1; order T009/T010/T011 → T012 → T013 → T014 →
  T015/T016 → T017/T018/T019/T020 → T021; T022 after T015. BLOCKS all user stories
- **User Stories (Phases 3–7)**: all depend on Phase 2. US1 (Phase 3) and US2 (Phase 4) are
  both P1 and together form the MVP. US3–US5 can start after Phase 2 independently, but US4
  and US5 modify components created in US1/US2, so on a single track run them in order
- **Polish (Phase 8)**: after all desired stories; T066 after T065; T067 last

### User Story Dependencies

- **US1 (P1)**: Foundation only. Creates `TaskCard`, `SubItemChecklist` used by later stories
- **US2 (P1)**: Foundation only for the editor/detail components; T040 wires into `Today.tsx`
  from US1, so on one track run US2 after US1
- **US3 (P2)**: Foundation only; reuses `FloatingAddButton`, `TaskEditorSheet`,
  `TaskDetailDialog` from US2 for its interaction tests (T041), so run after US2
- **US4 (P2)**: Extends `TaskEditorSheet`, `TaskDetailDialog`, `TaskCard`, `OccurrenceBlock`;
  run after US2 and US3
- **US5 (P3)**: Extends `Today.tsx` and `TaskDetailDialog`; run after US2

### Within Each User Story

- Tests are written first and must fail before implementation
- Hooks and leaf components (marked [P]) before the composing view
- View composition task is last and makes the story's tests pass

### Parallel Opportunities

- Phase 1: T003, T004, T005, T006, T007, T008 in parallel after T001
- Phase 2: T009, T010, T011 in parallel; T015 and T016 in parallel after T014; T017, T018,
  T019, T020, T022 in parallel
- US1: T023 and T024–T030 in parallel (7 files), then T031
- US2: T032, T033, T034, T035, T036, T037 in parallel, then T038 and T039 in parallel, then
  T040
- US3: T041, T042 then T043–T047 in parallel, then T048, then T049
- US4: T050, T051, T052, T053 in parallel, then T054 and T055 in parallel, then T056
- US5: T057 and T058 in parallel, then T059
- Phase 8: T060–T064 in parallel, then T065 → T066 → T067

---

## Parallel Example: User Story 1

```bash
# Write the failing view test and build all leaf pieces together:
Task: "T023 Write src/views/Today/Today.test.tsx"
Task: "T024 Create src/views/Today/hooks/useTodayOccurrences.ts"
Task: "T025 Create src/shared/components/SubItemChecklist/"
Task: "T027 Create src/views/Today/components/TodayHeader/"
Task: "T029 Create src/views/Today/components/TaskTimeline/"
Task: "T030 Create src/views/Today/components/AnytimeGroup/"
# then T026 TaskCard (needs T025), T028 UpNextCard (needs T026), then T031 Today.tsx
```

## Parallel Example: User Story 3

```bash
Task: "T043 Create src/views/Calendar/hooks/useWeekOccurrences.ts"
Task: "T044 Create src/views/Calendar/components/WeekHeader/"
Task: "T045 Create src/views/Calendar/components/OccurrenceBlock/"
Task: "T046 Create src/views/Calendar/components/AnytimeRow/"
Task: "T047 Create src/views/Calendar/components/DayColumn/"
# then T048 WeekGrid, then T049 Calendar.tsx
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (lint fix, tokens, deps, example removal)
2. Complete Phase 2: Foundational (models, recurrence, commands, repository, hooks, shell)
3. Complete Phase 3: Today view with seeded data
4. Complete Phase 4: Editor and detail dialog
5. **STOP and VALIDATE**: run quickstart US1 and US2 scenarios in `npm run dev:mock` and
   `npm run dev`; the app is a usable daily list that persists

### Incremental Delivery

1. MVP (US1 + US2) → demo on the web
2. Add US3 Calendar → demo the week view
3. Add US4 Repeating habits → demo daily habits with per-day completion
4. Add US5 Overdue → demo catch-up flow
5. Phase 8 polish + Android build → demo on a device

### Parallel Team Strategy

With two or three developers after Phase 2:

- Developer A: US1 then US2 (MVP track)
- Developer B: US3 Calendar (independent of the editor until T041's interaction tests)
- Developer C: Phase 8 Android setup (T005 config, T066 platform add) in parallel, since it
  only needs a building `dist/`

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Accessible names in tests must match `contracts/ui-contract.md` verbatim
- Field constraints in tasks are quoted from `data-model.md`; do not loosen them
- Commit after each task or logical group; Husky runs ESLint and Prettier on staged files
- Stop at any checkpoint to validate the story independently with `npm run test` and
  `npm run dev:mock`
