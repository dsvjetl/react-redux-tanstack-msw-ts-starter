import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import { Todos } from './index';
import store from '../../../../store';

describe('Todos', () => {
  it('should render', () => {
    render(
      <Provider store={store}>
        <Todos />
      </Provider>,
    );

    expect(screen.getByText('Todos')).toBeInTheDocument();
  });
});
