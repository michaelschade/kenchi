import { MessageRouterError } from '@michaelschade/kenchi-message-router';

export function shouldCompletelyIgnoreUrl(url: string | undefined) {
  return (
    url?.startsWith('chrome://') ||
    url?.startsWith('chrome-search://') ||
    url?.startsWith('devtools://') ||
    url === 'about:blank'
  );
}

export function isMissingReceiverError(error: unknown) {
  return (
    error instanceof MessageRouterError &&
    error.details?.type === 'chromeRuntime' &&
    error.details.details?.message ===
      'Could not establish connection. Receiving end does not exist.'
  );
}

export function isPortClosedError(error: unknown) {
  return (
    error instanceof MessageRouterError &&
    error.details?.type === 'chromeRuntime' &&
    error.details.details?.message ===
      'The message port closed before a response was received.'
  );
}
