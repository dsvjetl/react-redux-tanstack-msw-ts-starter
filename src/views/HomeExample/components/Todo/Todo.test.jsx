import { render, screen } from '@testing-library/react';

import { Todo } from './index';

describe('Todo', () => {
  it('should render', () => {
    render(<Todo />);

    expect(screen.getByTestId('todo')).toBeInTheDocument();
  });
});
