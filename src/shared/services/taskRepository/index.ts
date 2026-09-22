import { InMemoryTaskRepository } from './InMemoryTaskRepository';
import { PreferencesTaskRepository } from './PreferencesTaskRepository';
import type { TaskRepository } from './TaskRepository';
import { isMock } from '../../utils/isMock';
import { toDateKey } from '../../utils/date';
import { createSeedDocument } from '../../../mocks/seedTasks';

/** Picks the seeded in-memory store under `VITE_API_MOCK=true`. */
const createTaskRepository = (): TaskRepository =>
  isMock
    ? new InMemoryTaskRepository(createSeedDocument(toDateKey(new Date())))
    : new PreferencesTaskRepository();

export { createTaskRepository };
