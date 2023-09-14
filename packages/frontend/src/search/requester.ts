import { Request, Requester, Response } from '@algolia/requester-common';
import { addBreadcrumb, captureException, captureMessage } from '@sentry/react';

export const createRequester = ({
  onError,
  onSuccess,
  searchKeyLastUpdated,
}: {
  onError: () => void;
  onSuccess: () => void;
  searchKeyLastUpdated: string;
}): Requester => {
  return {
    send: async (request: Request): Promise<Response> => {
      const abortController = new AbortController();
      const signal = abortController.signal;

      const fetchTimeout = setTimeout(() => {
        abortController.abort();
        return {
          status: 0,
          content: 'Algolia fetch timeout',
          isTimedOut: true,
        };
      }, (request.connectTimeout + request.responseTimeout) * 1000);

      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.data,
          signal,
        });
        clearTimeout(fetchTimeout);
        if (!response.ok) {
          onError();
          const content = await response.text();
          captureMessage(`Error response from Algolia: ${response.status}`, {
            extra: {
              algoliaResponse: content,
              searchKeyLastUpdated,
              clientCurrentTime: new Date().toISOString(),
              searchKeyAge: `${
                (Date.now() - new Date(searchKeyLastUpdated).getTime()) / 1000
              } seconds`,
            },
          });
          return {
            status: response.status,
            content,
            isTimedOut: false,
          };
        }
        onSuccess();
        return {
          content: await response.text(),
          isTimedOut: false,
          status: response.status,
        };
      } catch (error) {
        clearTimeout(fetchTimeout);
        onError();
        if (error instanceof DOMException && error.name === 'AbortError') {
          // AbortErrors are expected when using an AbortController. Do nothing.
          // https://developer.mozilla.org/en-US/docs/Web/API/AbortController
          addBreadcrumb({
            category: 'search',
            message: 'Algolia search request aborted',
            level: 'info',
            data: { fetchError: error.message },
          });
        } else if (error instanceof TypeError) {
          // TypeError is a network or CORS error
          // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_that_the_fetch_was_successful
          addBreadcrumb({
            category: 'search',
            message: 'Network error fetching Algolia response',
            level: 'info',
            data: { fetchError: error.message },
          });
        } else {
          captureException(error);
        }
        return {
          content: 'Fetch error in custom Algolia requester',
          isTimedOut: false,
          status: 0,
        };
      }
    },
  };
};
