import { InMemoryTaskRepository } from './InMemoryTaskRepository';
import { emptyDocument } from '../../models/PlannerDocument';

describe('InMemoryTaskRepository', () => {
  it('reports empty until something is saved', async () => {
    const repo = new InMemoryTaskRepository();
    expect((await repo.load()).status).toBe('empty');

    const doc = { ...emptyDocument() };
    await repo.save(doc);
    const loaded = await repo.load();
    expect(loaded.status).toBe('ok');
    expect(loaded.doc).toEqual(doc);
    expect(loaded.doc).not.toBe(doc);
  });

  it('returns a seeded document as ok', async () => {
    const repo = new InMemoryTaskRepository(emptyDocument());
    expect((await repo.load()).status).toBe('ok');
  });

  it('can simulate a failed save once', async () => {
    const repo = new InMemoryTaskRepository();
    repo.failOnNextSave();
    await expect(repo.save(emptyDocument())).rejects.toThrow();
    await expect(repo.save(emptyDocument())).resolves.toBeUndefined();
  });
});
