import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { DateKey } from '../shared/models/Task';
import { addDaysToKey, toDateKey } from '../shared/utils/date';

interface CalendarState {
  /** First day of the visible 7-day window. */
  weekStart: DateKey;
}

const initialState: CalendarState = {
  weekStart: toDateKey(new Date()),
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    nextWeek: (state: CalendarState) => {
      state.weekStart = addDaysToKey(state.weekStart, 7);
    },
    previousWeek: (state: CalendarState) => {
      state.weekStart = addDaysToKey(state.weekStart, -7);
    },
    goToThisWeek: (state: CalendarState, action: PayloadAction<DateKey>) => {
      state.weekStart = action.payload;
    },
    setWeekStart: (state: CalendarState, action: PayloadAction<DateKey>) => {
      state.weekStart = action.payload;
    },
  },
});

export const { nextWeek, previousWeek, goToThisWeek, setWeekStart } =
  calendarSlice.actions;
export default calendarSlice.reducer;
