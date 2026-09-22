import type { PlannerDocument } from '../../models/PlannerDocument';

export type LoadResult =
  | { status: 'ok'; doc: PlannerDocument }
  | { status: 'empty'; doc: PlannerDocument }
  | { status: 'corrupt'; doc: PlannerDocument; reason: string };

export interface TaskRepository {
  /** Load the whole document. Never throws for "nothing stored". */
  load(): Promise<LoadResult>;
  /** Atomically replace the stored document. Rejects on write failure. */
  save(doc: PlannerDocument): Promise<void>;
}
