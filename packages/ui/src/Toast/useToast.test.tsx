import userEvent from '@testing-library/user-event';

import { render } from '../testUtils';
import { useToast } from './useToast';

const ComponentWithToast = () => {
  const { triggerToast } = useToast();
  return (
    <div>
      <button
        onClick={() => {
          triggerToast({ message: 'butter me up' });
        }}
      >
        pop some toast
      </button>
    </div>
  );
};

describe('useToast', () => {
  describe('triggerToast', () => {
    it('triggers a toast', async () => {
      const { getByText, findByText } = render(<ComponentWithToast />);
      const button = getByText('pop some toast');
      userEvent.click(button);
      const toast = await findByText('butter me up');
      expect(toast).toBeInTheDocument();
    });
  });
});
