import { Preferences } from '@capacitor/preferences';

import {
  CORRUPT_KEY,
  PreferencesTaskRepository,
  STORAGE_KEY,
} from './PreferencesTaskRepository';
import { emptyDocument } from '../../models/PlannerDocument';

const memory = new Map<string, string>();

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({
      value: memory.has(key) ? memory.get(key)! : null,
    })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      memory.set(key, value);
    }),
  },
}));

describe('PreferencesTaskRepository', () => {
  beforeEach(() => {
    memory.clear();
    vi.mocked(Preferences.set).mockClear();
  });

  it('reports empty when nothing is stored', async () => {
    const repo = new PreferencesTaskRepository();
    const result = await repo.load();
    expect(result.status).toBe('empty');
    expect(result.doc).toEqual(emptyDocument());
  });

  it('round-trips a document as JSON under the storage key', async () => {
    const repo = new PreferencesTaskRepository();
    const doc = {
      ...emptyDocument(),
      tasks: [
        {
          id: 'a',
          title: 'Make bed',
          startDate: '2026-09-22',
          time: null,
          repeat: { kind: 'none' as const },
          endDate: null,
          subItems: [],
          createdAt: '2026-09-22T08:00:00.000Z',
          updatedAt: '2026-09-22T08:00:00.000Z',
        },
      ],
    };
    await repo.save(doc);
    expect(memory.get(STORAGE_KEY)).toBe(JSON.stringify(doc));
    const loaded = await repo.load();
    expect(loaded.status).toBe('ok');
    expect(loaded.doc.tasks[0].title).toBe('Make bed');
  });

  it('quarantines invalid JSON once and returns corrupt', async () => {
    memory.set(STORAGE_KEY, '{');
    const repo = new PreferencesTaskRepository();
    const first = await repo.load();
    expect(first.status).toBe('corrupt');
    expect(first.doc).toEqual(emptyDocument());
    expect(memory.get(CORRUPT_KEY)).toBe('{');

    memory.set(STORAGE_KEY, '{"still":"broken"}');
    await repo.load();
    expect(memory.get(CORRUPT_KEY)).toBe('{');
  });

  it('treats schema failures as corrupt', async () => {
    memory.set(STORAGE_KEY, JSON.stringify({ version: 99 }));
    const result = await new PreferencesTaskRepository().load();
    expect(result.status).toBe('corrupt');
  });
});
