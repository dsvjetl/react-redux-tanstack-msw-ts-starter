import reducer, { close, openCreate, openEdit } from './taskEditorSlice';

describe('taskEditorSlice', () => {
  it('opens in create mode with a date', () => {
    expect(reducer(undefined, openCreate('2026-09-22'))).toEqual({
      mode: 'create',
      date: '2026-09-22',
    });
  });

  it('opens in edit mode with a task and date', () => {
    expect(
      reducer(undefined, openEdit({ taskId: 't1', date: '2026-09-23' })),
    ).toEqual({ mode: 'edit', taskId: 't1', date: '2026-09-23' });
  });

  it('closes', () => {
    expect(reducer({ mode: 'create', date: '2026-09-22' }, close())).toEqual({
      mode: 'closed',
    });
  });
});
