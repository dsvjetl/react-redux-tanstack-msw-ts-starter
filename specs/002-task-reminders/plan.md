# Implementation Plan: Task Reminders

**Branch**: `002-task-reminders` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-task-reminders/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add Google-Calendar-style reminders to the planner: every timed task carries a lead time of
5, 15, 30, 45 or 60 minutes (or none), with an app-wide default of 15 minutes and an app-wide
switch. Reminders are delivered as OS local notifications through `@capacitor/local-notifications`,
on a dedicated Android channel that plays a generated mellow chime, and tapping one opens the
task's detail. Instead of tracking reminders per command, a pure planning function derives the
complete set of reminders the OS should hold for the next 14 days and a reconcile step diffs
it against the OS after every change, on start and on resume, which covers every sync rule in
the spec with one mechanism. The document schema moves to version 2 with a migration.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict), React 19, Node 23.4.0 per `.nvmrc`

**Primary Dependencies**: existing stack from feature 001 (Vite 6, React Router 7, Redux
Toolkit 2, TanStack Query 5, Zod 4, `radix-ui`, React Hook Form, `date-fns`, Capacitor 8).
New runtime: `@capacitor/local-notifications` 8.3.x. New native code: a ~20-line Android
plugin to open the app's notification settings (R8). New asset: generated
`mellow_chime.wav` (R5). See [research.md](./research.md).

**Storage**: Same Capacitor Preferences document, bumped to version 2 (task reminder field,
per-occurrence override, preferences object) with a v1 → v2 migration. Scheduled reminders are
not stored; the OS pending list is reconciled against a computed plan.

**Testing**: Vitest + Testing Library; pure unit tests for plan, diff, ids and body text; a
`FakeNotificationGateway` for hooks and components; manual device checklist for delivery,
reboot, exact alarms and sound.

**Target Platform**: Android 10+ via Capacitor (primary); web build degrades to in-tab
notifications through the plugin's web implementation.

**Project Type**: mobile-app (web SPA packaged natively), single project

**Performance Goals**: Reconcile after a mutation completes in < 50 ms for 200 tasks (plan is
O(occurrences in 14 days)); notifications appear within 60 s of the scheduled moment on
device (SC-001) when exact alarms are allowed.

**Constraints**: Offline; no accounts; at most one reminder per occurrence; scheduling window
14 days; Android notification ids are int32; channel sound is immutable after creation;
Android 14+ exact alarms require a user-granted setting; never block saving on permission.

**Scale/Scope**: ≤ a few hundred pending notifications (Android caps alarms around 500 per
app); 1 new editor field, 1 settings sheet, 1 banner, 1 native helper, 4 pure modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status (pre-research) | Evidence / action |
|-----------|----------------------|-------------------|
| I. Feature-Sliced Structure & Scaffolding | PASS | Reminder domain is consumed by the editor, detail dialog, Today and the shell, so it lives in `src/shared/` (`utils/reminders/`, `services/native/notifications.ts`, `hooks/useReminderSync.ts`, components `ReminderPicker`, `ReminderSettingsSheet`, `RemindersBanner`). Views only gain a gear button and a banner slot. |
| II. Strict Types & Automated Quality Gates | PASS | New fields typed by Zod; document version literal bumped; lint/knip gates unchanged. |
| III. Clear State Ownership | PASS | Reminder settings and preferences live in the Query-owned document via commands; OS notification state is derived, never duplicated; Redux untouched. |
| IV. Mock-First API Development | PASS (adapted) | No HTTP. The `NotificationGateway` interface has a fake implementation used by tests and by `npm run dev:mock`, mirroring the repository pattern from feature 001. |
| V. Behavior-Driven Component Testing | PASS | Each new component gets a colocated test; every user story maps to failing-first tests; device-only behaviour is listed explicitly as manual in quickstart. |
| Stack & UX constraints | PASS with justification | One new runtime dependency and one tiny native helper justified below; SCSS Modules and tokens reused; permission and settings copy defined in the UI contract; reduced motion unaffected. |
| Workflow | PASS | Separate feature directory and branch; merge gate unchanged. |

**Gate result**: PASS. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-task-reminders/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── reminder-scheduler.md   # plan / reconcile / gateway API
│   ├── notification-payload.md # title, body, extra, channel, sound, ids
│   └── ui-contract.md          # editor field, settings sheet, banner, copy
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
scripts/
└── generate-chime.py                       # writes the two WAV copies below (committed output)
public/sounds/mellow_chime.wav              # web fallback sound
android/app/src/main/
├── AndroidManifest.xml                     # + SCHEDULE_EXACT_ALARM
├── res/raw/mellow_chime.wav                # channel sound
└── java/com/dava/todo/
    ├── MainActivity.java                   # registerPlugin(NotificationSettingsPlugin)
    └── NotificationSettingsPlugin.java     # opens APP_NOTIFICATION_SETTINGS
src/
├── shared/
│   ├── models/
│   │   ├── Task.ts                         # + reminderMinutesBefore, reminderLeadSchema
│   │   ├── Occurrence.ts                   # + reminderMinutesBefore on Occurrence/Override
│   │   ├── PlannerDocument.ts              # version 2, preferences, migrate v1→v2
│   │   └── ReminderPreferences.ts          # schema + defaults
│   ├── utils/
│   │   ├── plannerCommands.ts              # + setReminderPreferences; reminder in inputs
│   │   └── reminders/
│   │       ├── notificationId.ts           # fnv1a → int32
│   │       ├── notificationText.ts         # title/body per contract
│   │       ├── computeReminderPlan.ts      # doc + now → ReminderRequest[]
│   │       └── reconcileReminders.ts       # plan vs pending → { cancel, schedule }
│   ├── services/native/
│   │   ├── notifications.ts                # NotificationGateway + Capacitor implementation
│   │   ├── FakeNotificationGateway.ts      # tests + dev:mock
│   │   ├── NotificationGatewayContext.tsx  # provider + useNotificationGateway
│   │   └── notificationSettings.ts         # registerPlugin<NotificationSettingsPlugin>
│   ├── hooks/
│   │   ├── useReminderSync.ts              # runs reconcile on mutations/start/resume
│   │   ├── useReminderPermission.ts        # status, request once, exact-alarm state
│   │   └── usePlannerMutations.ts          # + setReminderPreferences, onSuccess → sync
│   └── components/
│       ├── ReminderPicker/                 # "Remind me" select (6 options)
│       ├── ReminderSettingsSheet/          # switch + default + permission status
│       ├── RemindersBanner/                # "Reminders off" / "may be late" indicator
│       ├── TaskEditorSheet/                # + Remind me field, permission prompt on save
│       ├── TaskDetailDialog/               # shows "Reminds you 15 minutes before"
│       └── AppShell/                       # notification tap listener, gateway provider
├── views/Today/components/TodayHeader/     # + gear button opening the settings sheet
└── mocks/seedTasks.ts                      # + reminder fields, preferences
```

**Structure Decision**: Follows feature 001's layout. Pure reminder logic sits under
`src/shared/utils/reminders/` so it is testable without React or Capacitor; the only module
that imports the plugin is `services/native/notifications.ts`, hidden behind the
`NotificationGateway` interface and a React context so tests and mock mode inject a fake.

## Complexity Tracking

> Runtime dependencies and native additions, as required by the constitution's stack rule.

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|-------------------------------------|
| `@capacitor/local-notifications` | Only way to fire reminders with the app closed and after reboot; provides channels, permissions, exact-alarm setting, tap events, web fallback | In-app timers cannot fire when the app is closed |
| `NotificationSettingsPlugin.java` (~20 lines) | FR-010/US4 need a button that opens the app's notification settings; the official plugin lacks it | A community plugin adds a dependency for one intent |
| `SCHEDULE_EXACT_ALARM` manifest permission | SC-001 needs exact delivery on Android 12+ | Inexact alarms can be minutes late in Doze |
| Generated `mellow_chime.wav` + script | FR-016 custom chime; generation avoids licensing | Device default sound is rejected by the spec |
| Document version 2 + migration | Reminder field, override and preferences must persist | A second storage key would split the source of truth |

## Phase 0: Research

Complete. See [research.md](./research.md). No `NEEDS CLARIFICATION` remains.

## Phase 1: Design & Contracts

Complete. Artifacts:

- [data-model.md](./data-model.md): schema v2, migration, reminder plan derivation, eligibility
  rules, preference defaults, and how every command affects reminders.
- [contracts/reminder-scheduler.md](./contracts/reminder-scheduler.md): `computeReminderPlan`,
  `reconcileReminders`, `NotificationGateway`, `useReminderSync` triggers.
- [contracts/notification-payload.md](./contracts/notification-payload.md): id derivation,
  title/body formatting, `extra`, channel definition, sound file, tap handling.
- [contracts/ui-contract.md](./contracts/ui-contract.md): "Remind me" field, settings sheet,
  banner, permission and exact-alarm copy, detail dialog line, accessible names.
- [quickstart.md](./quickstart.md): setup, chime generation, test commands, and device
  validation scenarios per user story.

### Constitution Check (post-design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Structure | PASS | Only sanctioned folders; new components follow the 4-file shape. |
| II. Quality gates | PASS | All new modules typed; script is Python stdlib, outside lint scope. |
| III. State ownership | PASS | Document v2 owns settings; OS state derived via reconcile. |
| IV. Mock-first | PASS (adapted) | Fake gateway in tests and `dev:mock`. |
| V. Testing | PASS | Pure modules exhaustively tested; device-only items enumerated as manual. |
| Stack & UX | PASS | Additions justified above; copy and roles fixed in the UI contract. |

**Gate result**: PASS. Ready for `/speckit-tasks`.

## Risks & Mitigations

- **Android 14+ exact-alarm setting off by default**: handled by R2 (check, explain, deep
  link to the setting, degrade to inexact); the banner tells the user reminders may be late.
- **Channel sound immutable**: the channel id is versioned (`reminders`); any future sound
  change ships as `reminders-v2` and the old channel is deleted (contract note).
- **Cold-start tap event**: relies on Capacitor retaining the event until the listener
  registers; verified on device in quickstart; fallback is simply opening Today.
- **Pending list limits**: the 14-day horizon caps daily habits at 14 reminders each; with
  ~30 repeating tasks that is ~420, under Android's ~500 alarm cap. If a document exceeds the
  cap, the plan truncates to the earliest reminders and logs a warning.
- **Spec amendment**: lead times were narrowed to 5/15/30/45/60 by the product owner during
  planning; the spec was updated in place and the change is noted in its status line.
- **No Android toolchain on the dev machine**: same as feature 001; the manual checklist
  runs on a machine with Android Studio.
