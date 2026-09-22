# Contract: TaskRepository and PlannerCommand

**Feature**: `001-daily-todo-planner` | Implementation: `src/shared/services/taskRepository/`,
`src/shared/utils/plannerCommands.ts`

This feature exposes no HTTP API. Its internal contracts are (1) the storage boundary and
(2) the command API that every UI mutation goes through. Both are TypeScript interfaces; the
persisted payload shape is in [storage-schema.json](./storage-schema.json).

## 1. TaskRepository

```ts
export interface TaskRepository {
  /** Load the whole document. Never throws for "nothing stored": returns an empty v1 doc. */
  load(): Promise<LoadResult>;
  /** Atomically replace the stored document. Rejects on write failure. */
  save(doc: PlannerDocument): Promise<void>;
}

export type LoadResult =
  | { status: 'ok'; doc: PlannerDocument }
  | { status: 'empty'; doc: PlannerDocument }            // first run
  | { status: 'corrupt'; doc: PlannerDocument; reason: string }; // schema failure; doc is empty
```

Guarantees:

- `load()` runs `migrate()` so callers always receive the current `version`.
- On `corrupt`, the implementation stores the raw payload under `<key>.corrupt` once and
  returns an empty document; the UI shows a non-blocking error state (FR-015, edge case).
- `save()` is last-write-wins; callers serialise writes through the mutation hook.

Implementations:

| Class | Backing store | Used when |
|-------|---------------|-----------|
| `PreferencesTaskRepository` | `@capacitor/preferences`, key `daily-todo-planner` | production, `npm run dev` |
| `InMemoryTaskRepository` | in-process object, optionally seeded | `npm run dev:mock`, all tests |

`createTaskRepository()` in `index.ts` selects by `isMock`.

## 2. PlannerCommand

```ts
export type SeriesScope = 'this' | 'future';

export type PlannerCommand =
  | { type: 'createTask'; input: TaskInput }
  | { type: 'updateTask'; taskId: string; input: TaskInput }                       // one-off only
  | { type: 'updateOccurrence'; taskId: string; date: DateKey; scope: SeriesScope; input: OccurrenceInput }
  | { type: 'deleteTask'; taskId: string }                                          // one-off only
  | { type: 'deleteOccurrence'; taskId: string; date: DateKey; scope: SeriesScope }
  | { type: 'endRepeat'; taskId: string }
  | { type: 'setOccurrenceDone'; taskId: string; date: DateKey; done: boolean }
  | { type: 'setSubItemDone'; taskId: string; date: DateKey; subItemId: string; done: boolean }
  | { type: 'moveToToday'; taskId: string };                                        // one-off only

export interface TaskInput {            // validated by taskFormSchema
  title: string; startDate: DateKey; time: TimeKey | null;
  repeat: RepeatRule; subItems: Array<{ id?: string; text: string }>;
}
export type OccurrenceInput = Pick<TaskInput, 'title' | 'time' | 'subItems'> & { repeat?: RepeatRule };

export interface CommandContext { now: Date; newId(): string }

export function applyCommand(doc: PlannerDocument, cmd: PlannerCommand, ctx: CommandContext): PlannerDocument;
```

Contract rules:

- `applyCommand` is pure: it never mutates `doc` and is deterministic given `ctx`.
- It throws `PlannerCommandError` with a `code` of `TASK_NOT_FOUND`, `SCOPE_NOT_ALLOWED`
  (one-off command on a repeating task or vice versa), or `INVALID_INPUT` (schema failure).
- Post-conditions per command are listed in [data-model.md](../data-model.md#commands-and-state-transitions).
- The mutation hook (`usePlannerMutations`) is the only caller in UI code; it applies the
  command to the cached document optimistically, calls `repository.save`, and on rejection
  restores the previous document and exposes the error.

## 3. Read API (hooks)

| Hook | Returns | Backing |
|------|---------|---------|
| `useTasks()` | `{ doc, status: 'loading' \| 'error' \| 'ready', loadStatus: LoadResult['status'] }` | `useQuery([queryKeys.planner])` |
| `useTodayOccurrences()` | see data-model "Today view" | `useTasks` + `useNow` |
| `useWeekOccurrences()` | see data-model "Calendar view" | `useTasks` + `calendarSlice.weekStart` |
| `useNow()` | `Date` refreshed every 30 s and on visibility/app-state change | timer + `@capacitor/app` |
