import { KenchiMessageRouter } from '@kenchi/commands';
import { failure, success } from '@kenchi/shared/lib/Result';

export function setupFetchPlaybackListeners(
  router: KenchiMessageRouter<'background'>
) {
  router.addCommandHandler(
    ['app', 'hud', 'dashboard'],
    'datasourceFetchRun',
    async ({ url, opts }) => {
      let resp;
      try {
        resp = await fetch(url, opts);
      } catch (e) {
        if (e instanceof Error) {
          return failure(e.message);
        }
        throw e;
      }
      const headers: Record<string, string> = {};
      for (const [k, v] of resp.headers.entries()) {
        headers[k.toLowerCase()] = v;
      }
      const bodyText = await resp.text();
      return success({ status: resp.status, headers, bodyText });
    }
  );
}
