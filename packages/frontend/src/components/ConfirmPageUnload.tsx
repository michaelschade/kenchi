import { useEffect } from 'react';

import { Prompt } from 'react-router-dom';

// React Router's Prompt has a known limitation in its history storage
// where it might not be able to navigate back to the page you were on.
// You can reproduce this by reloading the page, trigger the prompt
// below with a navigation event, then cancel and watch how the URL
// doesn't reset to the page you were on before attempting to navigate,
// even though you haven't left the page visually.

type Props = {
  message?: string;
};

const ConfirmPageUnload = ({
  message = 'You are about to leave this page. Changes you made may not be saved.',
}: Props) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [message]);

  return <Prompt message={message} />;
};

export default ConfirmPageUnload;
