import { css } from '@emotion/react';

import { useToast } from '@kenchi/ui/lib/Toast/useToast';

const Scratchpad = () => {
  const { triggerToast } = useToast();
  return (
    <div
      css={css`
        margin: 1rem;
      `}
    >
      <p>Pop some toast</p>
      <button
        type="button"
        onClick={() => triggerToast({ message: 'Marble rye' })}
      >
        Marble rye
      </button>
      <button
        type="button"
        onClick={() => triggerToast({ message: 'Pumpernickel' })}
      >
        Pumpernickel
      </button>
      <button
        type="button"
        onClick={() => triggerToast({ message: 'Cinnamon raisin' })}
      >
        Cinnamon raisin
      </button>
    </div>
  );
};

export default Scratchpad;
