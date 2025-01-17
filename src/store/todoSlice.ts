import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface InitialState {
  list: string[];
}

const initialState: InitialState = {
  list: ['Todo 1', 'Todo 2'],
};

const todoSlice = createSlice({
  name: 'todo',
  initialState,
  reducers: {
    add: (state: InitialState, action: PayloadAction<string>) => {
      state.list.push(action.payload);
    },
    reset: (state: InitialState) => {
      state.list = [];
    },
  },
});

export const { add, reset } = todoSlice.actions;
export default todoSlice.reducer;
