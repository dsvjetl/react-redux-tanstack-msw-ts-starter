import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SeriesScopeDialog } from './index';

describe('SeriesScopeDialog', () => {
  it('offers this-only, future and cancel', async () => {
    const onChoose = vi.fn();
    const onCancel = vi.fn();
    render(<SeriesScopeDialog open onChoose={onChoose} onCancel={onCancel} />);

    expect(
      screen.getByRole('alertdialog', { name: 'Apply to which occurrences?' }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'This occurrence only' }),
    );
    expect(onChoose).toHaveBeenCalledWith('this');
  });

  it('reports the future scope', async () => {
    const onChoose = vi.fn();
    render(<SeriesScopeDialog open onChoose={onChoose} onCancel={vi.fn()} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'This and all future occurrences' }),
    );
    expect(onChoose).toHaveBeenCalledWith('future');
  });

  it('cancels', async () => {
    const onCancel = vi.fn();
    render(<SeriesScopeDialog open onChoose={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
