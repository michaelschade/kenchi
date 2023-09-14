import { useEffect } from 'react';

export const useBodyClassObserver = (
  cb: (classList: DOMTokenList) => boolean
) => {
  useEffect(() => {
    if (cb(document.body.classList)) {
      return;
    }

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver((_mutationsList, observer) => {
      if (cb(document.body.classList)) {
        observer.disconnect();
      }
    });

    // Start observing the target node for configured mutations
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [cb]);
};
