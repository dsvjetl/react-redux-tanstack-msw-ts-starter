import type { RequestHandler } from 'msw';

// This feature calls no HTTP endpoints. Handlers are added here when a
// backend is introduced (see specs/001-daily-todo-planner/research.md R13).
const handlers: RequestHandler[] = [];

export { handlers };
