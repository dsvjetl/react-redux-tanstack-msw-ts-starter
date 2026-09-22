import type { PlannerDocument } from '../../models/PlannerDocument';
import type { LoadResult, TaskRepository } from './TaskRepository';

/** Test and `dev:mock` repository. Optionally seeded. */
class InMemoryTaskRepository implements TaskRepository {
  private doc: PlannerDocument | null;
  private failNextSave = false;

  constructor(seed: PlannerDocument | null = null) {
    this.doc = seed ? structuredClone(seed) : null;
  }

  async load(): Promise<LoadResult> {
    if (this.doc === null) {
      return {
        status: 'empty',
        doc: { version: 1, tasks: [], occurrenceStates: {}, overrides: {} },
      };
    }
    return { status: 'ok', doc: structuredClone(this.doc) };
  }

  async save(doc: PlannerDocument): Promise<void> {
    if (this.failNextSave) {
      this.failNextSave = false;
      throw new Error('Simulated save failure');
    }
    this.doc = structuredClone(doc);
  }

  /** Test helper: what is currently persisted. */
  snapshot(): PlannerDocument | null {
    return this.doc ? structuredClone(this.doc) : null;
  }

  /** Test helper: make the next save reject. */
  failOnNextSave() {
    this.failNextSave = true;
  }
}

export { InMemoryTaskRepository };
