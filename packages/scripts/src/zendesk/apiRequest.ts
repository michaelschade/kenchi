import Result, { success } from '@kenchi/shared/lib/Result';

import { App } from './types';

type FetchResponseXHR = {
  readyState: number;
  responseJSON: any;
  responseText: string;
  status: number;
  statusText: string;
};
type FetchResponseArgs =
  | [any, 'success', FetchResponseXHR]
  | [FetchResponseXHR, 'error', null];
type FetchResponse =
  | {
      result: 'success';
      data: any;
      response: FetchResponseXHR;
    }
  | {
      result: 'error';
      data: null;
      response: FetchResponseXHR;
    };

type RequestOptions = {
  url: string;
  [key: string]: unknown;
};

const callbacksById: Record<string, (...args: FetchResponseArgs) => void> = {};
export function setupAppForApiRequests(app: App) {
  // TODO: when we want to switch to listeners for variables, we can check
  // trigger for an `app.activated`, which will be called when a particular tab
  // is activated
  app.trigger = (eventName: string, data: any) => {
    const eventParts = eventName.split('.');
    const idParts = eventParts[0].split(':');
    if (idParts[0] !== 'request' || eventParts[1] !== 'always') {
      return;
    }
    const id = idParts[1];
    const callback = callbacksById[id];
    if (!callbacksById[id]) {
      console.log('unhandled request event', eventName, data);
      return;
    }
    delete callbacksById[id];

    const args = data.responseArgs as FetchResponseArgs;
    callback(...args);
  };
}

let nextId = 10000;

// For future us: we may be able to just make a `fetch` request ourselves, as
// it looks like the cookie is sufficient for auth.

// options API: https://developer.zendesk.com/api-reference/apps/apps-core-api/client_api/#clientrequestoptions
export function handleApiRequest(
  app: any,
  options: RequestOptions
): Promise<FetchResponse> {
  return new Promise((resolve) => {
    const id = `${nextId++}`;
    callbacksById[id] = (...resp: any[]) => {
      if (resp[1] === 'success') {
        resolve({
          result: 'success',
          data: resp[0],
          response: resp[2],
        });
      } else {
        resolve({
          result: 'error',
          data: null,
          response: resp[0],
        });
      }
    };
    const Request = app.framework().Request();
    const req = new Request(`request:${id}`, options, app);
    req.perform();
  });
}

export async function getPaginated(
  app: App,
  baseUrl: string,
  handleData: (data: any) => void
): Promise<Result<null, string>> {
  let url = `${baseUrl}?page[size]=100`;
  let hasMore = true;
  let afterCursor = null;
  while (hasMore) {
    if (afterCursor) {
      url += `&page[after]=${afterCursor}`;
    }
    const resp = await handleApiRequest(app, { url });
    if (resp.result === 'success') {
      handleData(resp.data);
      const { meta } = resp.data;
      hasMore = meta.has_more;
      afterCursor = meta.after_cursor;
    } else {
      return {
        success: false,
        error: resp.response.statusText,
      };
    }
  }
  return success(null);
}
