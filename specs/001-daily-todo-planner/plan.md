# Implementation Plan: Daily Todo Planner

**Branch**: `001-daily-todo-planner` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-daily-todo-planner/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Build a single-user, offline, mobile-first todo planner with a "Today" timeline (up-next card,
timed and anytime tasks, overdue group), a 7-day "Calendar" grid, a task editor with sub-items
and simple repeat rules (every day, weekdays, weekly on chosen days), and per-occurrence
completion. Data is persisted on the device through Capacitor Preferences behind a repository
interface, read through TanStack Query, and mutated through pure command functions so
recurrence and series-split logic is unit-testable. The web build is wrapped with Capacitor 8
into an Android app; UI uses Radix Primitives styled with SCSS Modules, React Hook Form + Zod
for the editor, `date-fns` for dates and Motion for reduced-motion-aware animation.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict), React 19, Node 23.4.0 per `.nvmrc` (Capacitor 8
requires Node ≥ 22)

**Primary Dependencies**: existing: Vite 6, React Router DOM 7, Redux Toolkit 2, TanStack Query
5, Axios (retained for future sync, unused by this feature), MSW 2, SASS. New runtime:
`@capacitor/core` 8, `@capacitor/android` 8, `@capacitor/app`, `@capacitor/preferences`,
`@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/keyboard`, `@capacitor/haptics`,
`radix-ui` 1.6, `react-hook-form` 7, `@hookform/resolvers` 5, `zod` 4, `date-fns` 4,
`lucide-react` 1 (`motion` was dropped during implementation, see research.md R8). New dev: `@capacitor/cli` 8, `typescript-eslint` 8,
`@testing-library/user-event` 14. See [research.md](./research.md) R1–R16.

**Storage**: Capacitor Preferences (Android `SharedPreferences`, `localStorage` on web), one
versioned JSON document under key `daily-todo-planner`; in-memory repository for tests and
`dev:mock`. No backend, no network calls.

**Testing**: Vitest 2 + Testing Library + user-event, jsdom; fake timers for time-dependent
behaviour; pure-function unit tests for recurrence, commands and schema; native plugins mocked
at the `src/shared/services/native/` boundary.

**Target Platform**: Android 10+ (API 29+, Chromium WebView) via Capacitor 8; also runs as a
web SPA in evergreen browsers for development. iOS is not targeted by this feature.

**Project Type**: mobile-app (web SPA packaged natively), single project

**Performance Goals**: Today and Calendar render within 1 s with 200 tasks over 4 weeks on a
mid-range phone (SC-004); done toggles reflect in < 100 ms perceived (SC-003); initial JS
bundle ≤ 300 KB gzipped.

**Constraints**: fully offline; SCSS Modules only, no inline styles; tokens defined once;
360 px minimum width; keyboard operable; WCAG AA contrast; `prefers-reduced-motion` respected;
no `any`; every component has a colocated test; no HTTP endpoints in this feature.

**Scale/Scope**: 1 user per device; low thousands of tasks at most; 2 routed views + 1 editor
sheet + 1 detail dialog; ~20 components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status (pre-research) | Evidence / action |
|-----------|----------------------|-------------------|
| I. Feature-Sliced Structure & Scaffolding | PASS | Views `Today`, `Calendar` under `src/views/`; shared task domain under `src/shared/` (used by both views, so promotion is justified); components via `npm run generate`; routes in `routePaths.ts`; example files (`HomeExample`, `HeaderExample`, `todoSlice`, `postsMock`) deleted. |
| II. Strict Types & Automated Quality Gates | PASS with remediation | TS strict on; Zod schemas give typed models. Gap found: ESLint does not lint `.ts/.tsx` (R14). Remediation is the first implementation task: add `typescript-eslint`, extend file globs, `react.version: 'detect'`. Knip must be clean after example removal. |
| III. Clear State Ownership | PASS | Persisted document in TanStack Query via `useTasks`/`usePlannerMutations` hooks in `src/shared/hooks/`; query key in `src/shared/constants/queryKeys.ts`; Redux only for `calendarSlice` (week start) and `taskEditorSlice` (editor UI state); no task data in Redux. Storage is not HTTP, so `apiService` is unused; Principle III's "all HTTP through apiService" is satisfied vacuously. |
| IV. Mock-First API Development | PASS (adapted) | No HTTP endpoints exist. `InMemoryTaskRepository` seeded via `src/mocks/seedTasks.ts` powers `npm run dev:mock` and tests; MSW worker retained with an empty handler list (R13). |
| V. Behavior-Driven Component Testing | PASS | Every component folder gets a colocated `.test.tsx`; each user story maps to at least one failing-first test (see quickstart scenarios); pure domain modules unit-tested; tests are a merge gate, not a commit gate. |
| Stack & UX constraints | PASS with justification | New runtime dependencies justified in Complexity Tracking. No SSR; `BrowserRouter` kept (R11). SCSS Modules + tokens in `src/index.scss`. Loading/empty/error states, 360 px, keyboard, AA contrast, reduced motion are explicit requirements (FR-015, FR-016). |
| Workflow | PASS | Feature branch + PR to `main`; merge gate runs lint, test, build, knip. |

**Gate result**: PASS. No unjustified violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-daily-todo-planner/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── task-repository.md   # TaskRepository interface + command API
│   ├── storage-schema.json  # JSON Schema of the persisted document (v1)
│   └── ui-contract.md       # Routes, screens, accessible names, states
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
capacitor.config.ts                  # appId, appName, webDir: 'dist', androidScheme: 'https'
android/                             # generated by `npx cap add android`, committed
eslint.config.js                     # extended to **/*.{ts,tsx} via typescript-eslint
src/
├── main.tsx                         # unchanged bootstrap (runMockServer → render)
├── App.tsx                          # providers + AppShell + AppRoutes (HeaderExample removed)
├── index.scss                       # reset + design tokens (CSS custom properties)
├── assets/
│   └── styles/_mixins.scss          # card, focus-ring, reduced-motion mixins
├── routing/
│   ├── routePaths.ts                # TODAY: '/', CALENDAR: '/calendar'
│   ├── Routes.tsx
│   └── index.ts
├── store/
│   ├── index.ts                     # configureStore + RootState/AppDispatch types
│   ├── calendarSlice.ts             # weekStart (YYYY-MM-DD), next/prev/today reducers
│   └── taskEditorSlice.ts           # editor sheet: closed | create{date} | edit{taskId, date}
├── mocks/
│   ├── handlers.ts                  # empty handler list (no HTTP in this feature)
│   ├── server.ts                    # unchanged
│   └── seedTasks.ts                 # seeded document for InMemoryTaskRepository
├── shared/
│   ├── constants/queryKeys.ts       # { planner: 'planner' }
│   ├── models/
│   │   ├── Task.ts                  # Task, RepeatRule, SubItem types + zod schemas
│   │   ├── Occurrence.ts            # Occurrence, OccurrenceState, OccurrenceOverride
│   │   └── PlannerDocument.ts       # versioned document schema + migrate()
│   ├── services/
│   │   ├── taskRepository/
│   │   │   ├── TaskRepository.ts    # interface
│   │   │   ├── PreferencesTaskRepository.ts
│   │   │   ├── InMemoryTaskRepository.ts
│   │   │   └── index.ts             # createTaskRepository(): picks by isMock
│   │   └── native/
│   │       ├── backButton.ts        # @capacitor/app wrapper
│   │       ├── haptics.ts           # optional light impact on done toggle
│   │       └── appearance.ts        # status bar + splash screen setup
│   ├── utils/
│   │   ├── date.ts                  # toDateKey, parseDateKey, formatters, weekRange
│   │   ├── occurrences.ts           # occurrencesInRange(), sortOccurrences()
│   │   ├── plannerCommands.ts       # applyCommand(doc, cmd) pure reducer
│   │   └── occurrenceKey.ts         # `${taskId}:${date}`
│   ├── hooks/
│   │   ├── useTasks.ts              # useQuery(['planner']) → document
│   │   ├── usePlannerMutations.ts   # useMutation per command with optimistic update
│   │   └── useNow.ts                # ticking clock, visibility-aware
│   └── components/
│       ├── AppShell/                # safe-area layout, back-button effect, outlet
│       ├── BottomNav/               # Today | Calendar tabs (aria-current)
│       ├── FloatingAddButton/
│       ├── TaskCard/                # timeline card incl. sub-items + repeat badge
│       ├── SubItemChecklist/
│       ├── TaskEditorSheet/         # Radix Dialog bottom sheet + RHF form
│       ├── RepeatRulePicker/        # RadioGroup + weekday ToggleGroup
│       ├── TaskDetailDialog/        # done/edit/delete/end-repeat/move-to-today
│       ├── SeriesScopeDialog/       # "This occurrence" vs "This and future"
│       ├── ConfirmDialog/           # AlertDialog wrapper
│       ├── EmptyState/
│       ├── ErrorState/
│       └── LoadingState/
└── views/
    ├── Today/
    │   ├── Today.tsx
    │   ├── Today.module.scss
    │   ├── Today.test.tsx
    │   ├── index.ts
    │   ├── hooks/useTodayOccurrences.ts   # upNext, overdue, timed, anytime, remaining
    │   └── components/
    │       ├── TodayHeader/               # date heading + remaining badge
    │       ├── UpNextCard/
    │       ├── TaskTimeline/              # time rail + TaskCards
    │       ├── OverdueGroup/
    │       └── AnytimeGroup/
    └── Calendar/
        ├── Calendar.tsx
        ├── Calendar.module.scss
        ├── Calendar.test.tsx
        ├── index.ts
        ├── hooks/useWeekOccurrences.ts    # occurrences grouped by day for weekStart
        └── components/
            ├── WeekHeader/                # range chip + prev/next/today controls
            ├── WeekGrid/                  # CSS grid: hour rows × day columns
            ├── DayColumn/
            ├── AnytimeRow/
            └── OccurrenceBlock/           # title + sub-item count badge
```

**Structure Decision**: Single project following the starter's `views/` + `shared/` split.
The task domain (models, repository, commands, hooks) is shared because both views consume it,
which satisfies the constitution's "promote only with a second consumer" rule. Native
integration is isolated in `src/shared/services/native/` so components never import Capacitor
directly and tests stay platform-free. `android/` and `capacitor.config.ts` are the only
additions outside `src/`.

## Complexity Tracking

> Runtime dependencies added by this feature, as required by the constitution's stack rule.

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|-------------------------------------|
| Capacitor 8 core/CLI/android + app, preferences, status-bar, splash-screen, keyboard, haptics plugins | User requirement: ship as an Android app; reliable device storage; back-button, safe-area and keyboard behaviour | PWA/TWA gives no reliable storage guarantee or native back-button handling; React Native would discard the starter |
| `radix-ui` | Accessible dialog, alert dialog, checkbox, radio/toggle groups required by FR-016/SC-007 | Hand-rolled focus traps and ARIA are error-prone; shadcn needs Tailwind, vaul is unmaintained |
| `react-hook-form` + `@hookform/resolvers` + `zod` | FR-004 validation rules in one schema reused for storage parsing; fast forms in WebView | Manual `useState` forms duplicate validation and re-render on every keystroke |
| `date-fns` | Local-date arithmetic, week ranges, weekday checks, reference-style formatting | Hand-written date math is where recurrence bugs live; `Intl` alone lacks arithmetic |
| ~~`motion`~~ (removed) | Originally for sheet/card animation | Radix keeps dialogs mounted through the close animation, so CSS keyframes cover every case; see research.md R8 |
| `lucide-react` | Consistent icon set for nav, add, check, repeat | Inline SVG per icon is more files to maintain and style |
| `typescript-eslint` (dev) | Constitution Principle II cannot hold while `.ts/.tsx` is unlinted (R14) | None; this is a defect in the starter |
| `@testing-library/user-event` (dev) | Realistic keyboard/pointer interaction in tests for FR-016 | `fireEvent` skips focus and keyboard semantics |

Not added (considered and rejected): `rrule`, `vaul`, `nanoid`, calendar libraries, Dexie,
SQLite plugins. See research.md.

## Phase 0: Research

Complete. See [research.md](./research.md). No `NEEDS CLARIFICATION` remains in the Technical
Context.

## Phase 1: Design & Contracts

Complete. Artifacts:

- [data-model.md](./data-model.md): entities, validation, document schema, state transitions,
  recurrence expansion and series-split rules.
- [contracts/task-repository.md](./contracts/task-repository.md): `TaskRepository` interface
  and the `PlannerCommand` union with pre/post-conditions.
- [contracts/storage-schema.json](./contracts/storage-schema.json): JSON Schema for the
  persisted document (version 1).
- [contracts/ui-contract.md](./contracts/ui-contract.md): routes, screen composition,
  accessible names, and loading/empty/error state contract used by tests.
- [quickstart.md](./quickstart.md): setup, run, test and Android packaging steps plus
  validation scenarios mapped to user stories.

### Constitution Check (post-design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Structure | PASS | Tree above uses only the sanctioned folders; every component has the 4-file shape. |
| II. Quality gates | PASS | R14 remediation scheduled as the first task; Zod removes `any` from storage parsing. |
| III. State ownership | PASS | Query holds the document; Redux holds 2 UI slices; commands are pure. |
| IV. Mock-first | PASS (adapted) | In-memory seeded repository; no endpoints, so no handlers; MSW plumbing retained. |
| V. Testing | PASS | Contracts define accessible names so tests assert behaviour, not markup. |
| Stack & UX | PASS | All additions justified above; tokens, SCSS Modules, BrowserRouter, no SSR. |

**Gate result**: PASS. Ready for `/speckit-tasks`.

## Risks & Mitigations

- **Android toolchain missing on the dev machine** (no JDK, no `ANDROID_HOME`): web build and
  tests are unaffected; quickstart lists the install steps; the Android task is last in order.
- **Series-split correctness** (edit "this and future"): covered by exhaustive unit tests on
  `plannerCommands.ts` before any UI wiring.
- **Storage document growth**: bounded by scope; `PlannerDocument` carries a `version` so a
  move to SQLite can migrate.
- **Node version drift**: `.nvmrc` says 23.4.0 (an odd, non-LTS line). Capacitor 8 needs ≥ 22.
  Moving `.nvmrc` to 24 LTS is recommended but is a separate, deliberate change.
- **App ID**: set to `com.dava.todo` (display name "Todo Dava") on 2026-09-22; the note below is historical. `capacitor.config.ts` used `com.example.dailytodoplanner` until the real
  package name is confirmed; it must be final before the first Play Store upload.
