import './App.scss';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { AppRoutes } from './routing';
import store from './store';
import { AppShell } from './shared/components/AppShell';
import { createTaskRepository } from './shared/services/taskRepository';
import { TaskRepositoryProvider } from './shared/services/taskRepository/TaskRepositoryContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const repository = createTaskRepository();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <TaskRepositoryProvider repository={repository}>
            <AppShell>
              <AppRoutes />
            </AppShell>
          </TaskRepositoryProvider>
        </Provider>
        {import.meta.env.DEV ? (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        ) : null}
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
