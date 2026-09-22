import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SubItemChecklist } from './index';

describe('SubItemChecklist', () => {
  it('renders a checkbox per sub-item and reports toggles', async () => {
    const onToggle = vi.fn();
    render(
      <SubItemChecklist
        subItems={[
          { id: 'a', text: 'Chapter 4' },
          { id: 'b', text: 'Take notes' },
        ]}
        doneSubItemIds={['b']}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Take notes' })).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Chapter 4' }));
    expect(onToggle).toHaveBeenCalledWith('a', true);
  });

  it('renders nothing without sub-items', () => {
    const { container } = render(
      <SubItemChecklist subItems={[]} doneSubItemIds={[]} onToggle={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
