import { Preferences } from '@capacitor/preferences';

import {
  type PlannerDocument,
  emptyDocument,
  migrate,
} from '../../models/PlannerDocument';
import type { LoadResult, TaskRepository } from './TaskRepository';

const STORAGE_KEY = 'daily-todo-planner';
const CORRUPT_KEY = `${STORAGE_KEY}.corrupt`;

/** Production repository backed by Capacitor Preferences. */
class PreferencesTaskRepository implements TaskRepository {
  constructor(private readonly key: string = STORAGE_KEY) {}

  async load(): Promise<LoadResult> {
    const { value } = await Preferences.get({ key: this.key });
    if (value === null || value === '') {
      return { status: 'empty', doc: emptyDocument() };
    }

    let payload: unknown;
    try {
      payload = JSON.parse(value);
    } catch (error) {
      await this.quarantine(value);
      return {
        status: 'corrupt',
        doc: emptyDocument(),
        reason: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }

    const result = migrate(payload);
    if (result.status === 'corrupt') {
      await this.quarantine(value);
    }
    return result;
  }

  async save(doc: PlannerDocument): Promise<void> {
    await Preferences.set({ key: this.key, value: JSON.stringify(doc) });
  }

  /** Keep the unreadable payload once so it can be inspected later. */
  private async quarantine(raw: string) {
    const corruptKey = `${this.key}.corrupt`;
    const existing = await Preferences.get({ key: corruptKey });
    if (existing.value === null) {
      await Preferences.set({ key: corruptKey, value: raw });
    }
  }
}

export { CORRUPT_KEY, PreferencesTaskRepository, STORAGE_KEY };
