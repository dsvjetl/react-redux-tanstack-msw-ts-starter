import { combineReducers, configureStore } from '@reduxjs/toolkit';

import calendarReducer from './calendarSlice';
import taskEditorReducer from './taskEditorSlice';

const rootReducer = combineReducers({
  calendar: calendarReducer,
  taskEditor: taskEditorReducer,
});

type RootState = ReturnType<typeof rootReducer>;

const setupStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
  });

type AppStore = ReturnType<typeof setupStore>;
type AppDispatch = AppStore['dispatch'];

const store = setupStore();

export { setupStore };
export type { AppDispatch, RootState };
export default store;
