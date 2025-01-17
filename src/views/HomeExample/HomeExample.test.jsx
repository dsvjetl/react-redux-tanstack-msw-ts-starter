import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';

import { HomeExample } from './index';
import store from '../../store';

const queryClient = new QueryClient();

describe('HomeExample', () => {
  it('should render', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <HomeExample />
        </Provider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('dsvjetl React Starter')).toBeInTheDocument();
  });

  it('should be in loading state', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <HomeExample />
        </Provider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Loading posts...')).toBeInTheDocument();
  });
});
