import { createSlice } from '@reduxjs/toolkit';

const todoSlice = createSlice({
  name: 'todo',
  initialState: {
    list: ['Todo 1', 'Todo 2'],
  },
  reducers: {
    add: (state, action) => {
      state.list.push(action.payload);
    },
    reset: (state) => {
      state.list = [];
    },
  },
});

export const { add, reset } = todoSlice.actions;
export default todoSlice.reducer;
