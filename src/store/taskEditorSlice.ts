import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { DateKey } from '../shared/models/Task';

type TaskEditorState =
  | { mode: 'closed' }
  | { mode: 'create'; date: DateKey }
  | { mode: 'edit'; taskId: string; date: DateKey };

const initialState = { mode: 'closed' } as TaskEditorState;

const taskEditorSlice = createSlice({
  name: 'taskEditor',
  initialState,
  reducers: {
    openCreate: (
      _state: TaskEditorState,
      action: PayloadAction<DateKey>,
    ): TaskEditorState => ({ mode: 'create', date: action.payload }),
    openEdit: (
      _state: TaskEditorState,
      action: PayloadAction<{ taskId: string; date: DateKey }>,
    ): TaskEditorState => ({
      mode: 'edit',
      taskId: action.payload.taskId,
      date: action.payload.date,
    }),
    close: (): TaskEditorState => ({ mode: 'closed' }),
  },
});

export const { openCreate, openEdit, close } = taskEditorSlice.actions;
export type { TaskEditorState };
export default taskEditorSlice.reducer;
