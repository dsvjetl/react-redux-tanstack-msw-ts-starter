<!--
Sync Impact Report
- Version change: (none, template) → 1.0.0
- Modified principles: n/a (initial ratification)
- Added sections:
  - Core Principles (I. Feature-Sliced Structure & Scaffolding,
    II. Strict Types & Automated Quality Gates,
    III. Clear State Ownership: Server vs Client,
    IV. Mock-First API Development,
    V. Behavior-Driven Component Testing)
  - Technology Stack & UX Constraints
  - Development Workflow & Quality Gates
  - Governance
- Removed sections: none
- Templates requiring updates: none (plan/spec/tasks templates read the constitution at runtime)
- Follow-up TODOs: none
-->

# Modern React Todo App Constitution

## Core Principles

### I. Feature-Sliced Structure & Scaffolding

The starter's folder layout is the law of the land, not a suggestion.

- Page-level components live in `src/views/<ViewName>/`; reusable, cross-feature code lives in
  `src/shared/` (components, services, utils). Redux slices live in `src/store/`, route
  definitions in `src/routing/`, MSW wiring in `src/mocks/`.
- Code that serves a single view MUST be colocated inside that view's folder using the
  established sub-folders: `components/`, `hooks/`, `services/`, `models/`, `constants/`,
  `mocks/`, `utils/`. Code MUST be promoted to `src/shared/` only when a second consumer exists.
- Every component MUST be a PascalCase folder containing `<Name>.tsx`, `<Name>.module.scss`,
  `<Name>.test.tsx`, and an `index.ts` barrel that re-exports the default export as a named
  export. New components MUST be created with `npm run generate` (Plop) so the shape is uniform.
- Route paths MUST be declared in `src/routing/routePaths.ts` and referenced by constant; string
  literals for routes in components are forbidden.
- The example files (`HomeExample`, `HeaderExample`, `todoSlice`) MUST be removed or refactored
  into real features rather than extended as examples.

**Rationale**: A predictable structure keeps navigation cheap, makes ownership obvious, and lets
scaffolding and dead-code tooling (Plop, Knip) work without special cases.

### II. Strict Types & Automated Quality Gates

Code MUST be correct by construction and clean before it is committed.

- TypeScript `strict` mode stays on. New code MUST NOT introduce `any`, `@ts-ignore`, or
  `@ts-expect-error` without an inline comment stating why. Props MUST be declared as a named
  `interface <Name>Props`. Data shapes from the API MUST be modelled in a `models/` file.
- ESLint (`npm run lint`) and Prettier (`npm run format`) are the single source of style truth:
  single quotes, semicolons, trailing commas, 80-column width, 2-space indent. Imports MUST be
  grouped builtin → external → internal with a blank line between groups, and MUST omit file
  extensions.
- The Husky pre-commit hook (lint-staged: ESLint fix + Prettier) MUST NOT be bypassed with
  `--no-verify`. A commit that would fail lint is not a valid commit.
- `npm run scan:deadcode` (Knip) MUST report zero unused files, exports, or dependencies before a
  feature is considered complete.
- Accessibility lint rules (`jsx-a11y` recommended) are errors, not warnings. Interactive
  elements MUST be real buttons/inputs/links with accessible names.

**Rationale**: Automated gates are cheaper than review comments and keep the codebase consistent
regardless of who (or what) writes the code.

### III. Clear State Ownership: Server vs Client

Every piece of state has exactly one home.

- Server state (anything fetched from or persisted to an API) MUST live in TanStack Query. Each
  query or mutation MUST be wrapped in a custom hook (`use<Thing>`) inside the owning view's
  `hooks/` folder, and its key MUST come from a `constants/queryKeys.ts` object. Raw
  `useQuery`/`useMutation` calls inside components are forbidden.
- All HTTP calls MUST go through the shared `apiService` (Axios instance) via thin functions in
  a `services/` file. Components and hooks MUST NOT import Axios directly.
- Client-only state that is shared across views (filters, UI preferences, optimistic drafts)
  MUST live in a Redux Toolkit slice under `src/store/`, using `createSlice` and typed
  `PayloadAction`. Local, ephemeral UI state stays in component `useState`.
- Server data MUST NOT be copied into Redux. Derived data MUST be computed with selectors or
  `select` options, never stored twice.
- Environment access MUST go through `getEnvVar`; variables MUST be prefixed `VITE_`.

**Rationale**: Splitting server and client state along library lines removes cache
synchronisation bugs, keeps Redux small, and makes loading/error handling uniform.

### IV. Mock-First API Development

The app MUST be fully usable with `npm run dev:mock` and no backend.

- Every API endpoint the app calls MUST have a corresponding MSW handler. Handlers MUST be
  created per view in a `utils/createApiMockHandler.ts` (or equivalent) and registered in
  `src/mocks/handlers.ts`. Mock payloads MUST live in the view's `mocks/` folder and MUST be
  typed with the same `models/` types as real responses.
- Handlers MUST cover success, empty, and error responses for endpoints the UI treats
  differently, so loading, empty, and error states can be exercised without a server.
- MSW is dev/test only: `VITE_API_MOCK` MUST remain `false` in production env files, and the
  production build MUST NOT ship `mockServiceWorker.js` (enforced by the Vite plugin).
- When an endpoint contract changes, the mock handler and the model type MUST change in the
  same commit.

**Rationale**: Mock-first development decouples UI progress from backend availability and gives
tests deterministic data.

### V. Behavior-Driven Component Testing

Tests describe what the user sees, not how the component is built.

- Every component folder MUST contain a colocated `<Name>.test.tsx` that renders the component
  with Vitest + React Testing Library and asserts on the accessible output (`screen.getByRole`,
  `getByText`, `getByLabelText`). Components that depend on Redux or TanStack Query MUST be
  rendered inside the corresponding providers in tests.
- Tests MUST assert behavior (rendered text, state after interaction, loading/empty/error UI),
  not implementation details (internal state, class names, call counts of private helpers).
  Snapshot tests are not a substitute for assertions.
- Every user story in a spec MUST map to at least one test that fails before the feature is
  implemented and passes after. Bug fixes MUST add a regression test.
- The full suite (`npm run test`) MUST pass before a pull request is opened. Per the starter's
  policy, unit tests are intentionally NOT part of the pre-commit hook; they are a merge gate.

**Rationale**: Behavior-level tests survive refactors and double as living documentation of the
product; keeping them out of the commit hook preserves the fast local loop.

## Technology Stack & UX Constraints

- **Runtime**: Node.js as pinned in `.nvmrc` (23.x), npm 10.x. Contributors MUST run `nvm use`.
- **Core stack** (versions per `package.json`; upgrades are deliberate, reviewed changes): React
  19, TypeScript 5.7, Vite 6, React Router DOM 7, Redux Toolkit 2 / React Redux 9, TanStack
  Query 5, Axios, MSW 2, Vitest 2, Testing Library, SASS. Adding a new runtime dependency MUST be
  justified in the plan's Complexity Tracking section.
- **Rendering model**: client-side SPA only; no SSR. Routing is React Router `BrowserRouter`.
- **Styling**: SCSS Modules only, imported as `styles` with camelCase class names. Global styles
  are limited to the reset and design tokens in `src/index.scss`. Inline style objects and
  global class selectors in components are forbidden. Shared design tokens (colors, spacing,
  radii, typography, transitions) MUST be defined once as SCSS variables/CSS custom properties
  and reused, so the "modern, cool-looking" visual language stays consistent.
- **UX baseline** for the todo app: every async view MUST render explicit loading, empty, and
  error states; layouts MUST be responsive from 360px up; all interactions MUST be keyboard
  operable with visible focus; color contrast MUST meet WCAG AA; motion MUST respect
  `prefers-reduced-motion`.
- **Configuration**: runtime config comes only from `VITE_`-prefixed env vars documented in
  `.env.example`. Secrets MUST NOT be committed.

## Development Workflow & Quality Gates

- **Spec-driven flow**: features follow `/speckit-specify` → `/speckit-clarify` (as needed) →
  `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`. Plans MUST include a Constitution
  Check that cites each principle above and records any justified deviation.
- **Branching**: one branch per feature or fix, opened as a pull request against `main`.
  Direct pushes to `main` are forbidden.
- **Commit gate** (automated, Husky): ESLint and Prettier MUST pass on staged files.
- **Merge gate** (reviewer-verified): `npm run lint`, `npm run test`, `npm run build`, and
  `npm run scan:deadcode` MUST all succeed; new components MUST have tests; new endpoints MUST
  have MSW handlers; the PR description MUST state which spec/plan it implements.
- **Review**: at least one reviewer MUST confirm constitution compliance. Reviewers MUST reject
  changes that add abstraction without a present need (YAGNI) or that duplicate state.
- **Documentation**: user-facing behavior changes MUST update `README.md` or the feature spec in
  the same PR.

## Governance

- This constitution supersedes the README's general guidelines and any ad-hoc team practice
  where they conflict. The README remains the onboarding reference for tooling commands.
- **Amendments**: proposed via a pull request that edits this file, states the motivation, and
  lists affected specs/plans. Approval requires the same review as a code change. Breaking
  changes to principles MUST include a migration note describing how existing code is brought
  into compliance.
- **Versioning** follows semantic versioning: MAJOR for removing or redefining a principle in a
  backward-incompatible way, MINOR for adding a principle or materially expanding guidance,
  PATCH for clarifications and wording fixes. `Last Amended` is updated on every change.
- **Compliance review**: every plan's Constitution Check and every PR review MUST verify
  adherence. Violations discovered after merge are logged as tasks and fixed in the next
  iteration rather than left as precedent.
- Runtime development guidance for AI agents lives in this file and the `.specify/` templates;
  no separate agent guidance file is authoritative over the constitution.

**Version**: 1.0.0 | **Ratified**: 2026-09-22 | **Last Amended**: 2026-09-22
