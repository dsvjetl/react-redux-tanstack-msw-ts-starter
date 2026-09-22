import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { type RootState, setupStore } from '../../../store';
import { InMemoryTaskRepository } from '../../services/taskRepository/InMemoryTaskRepository';
import type { TaskRepository } from '../../services/taskRepository/TaskRepository';
import { TaskRepositoryProvider } from '../../services/taskRepository/TaskRepositoryContext';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  repository?: TaskRepository;
  preloadedState?: Partial<RootState>;
  route?: string;
}

const user = () =>
  userEvent.setup({
    advanceTimers: (ms) => {
      if (vi.isFakeTimers()) vi.advanceTimersByTime(ms);
    },
  });

const renderWithProviders = (
  ui: ReactElement,
  {
    repository = new InMemoryTaskRepository(),
    preloadedState,
    route = '/',
    ...renderOptions
  }: RenderWithProvidersOptions = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  const store = setupStore(preloadedState);

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <TaskRepositoryProvider repository={repository}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </TaskRepositoryProvider>
      </Provider>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
    queryClient,
    repository,
    user: user(),
  };
};

export { renderWithProviders, user };
