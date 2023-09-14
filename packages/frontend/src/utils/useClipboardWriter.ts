import { useCallback, useEffect, useState } from 'react';

type State = 'idle' | 'pending' | 'success' | 'error';

export const useClipboardWriter = () => {
  const [state, setState] = useState<State>('idle');

  const write = useCallback((text: string) => {
    setState('pending');
    navigator.clipboard.writeText(text).then(
      () => {
        setState('success');
      },
      (error) => {
        console.warn('Could not copy text to clipboard:', text, error);
        setState('error');
      }
    );
  }, []);

  useEffect(() => {
    const listener = () => {
      if (state === 'success' || state === 'error') {
        setState('idle');
      }
    };
    window.addEventListener('click', listener);
    return () => window.removeEventListener('click', listener);
  }, [state]);

  return { state, write };
};
