import { captureMessage } from '@sentry/react';

import { clearCache } from '../graphql/cache';
import { defaultSpaceKey } from '../hud/TopBar';
import { reloadWithLocation } from '../utils/history';
import getLocalForage from '../utils/localForage';
import { DEFAULT_STORAGE_KEY } from '../utils/spaceUrl';

export const purgeAndRedirect = async (to = '/') => {
  await clearCache();
  await getLocalForage().removeItem('apollo-cache-persist');

  // TODO: better centralize default space storage
  window.localStorage.removeItem(defaultSpaceKey);
  window.localStorage.removeItem(DEFAULT_STORAGE_KEY);

  broadcastLogin();
  reloadWithLocation(to);
  // Other things we've tried with varrying degrees of success.
  // client.stop();
  // await client.clearStore();
  // await client.resetStore();
};

export const defaultGetAuthToken = async (
  interactive: boolean
): Promise<string> => {
  const onGAPI = () => {
    if (window.gapiCookieError) {
      throw new Error('third_party_cookies');
    }
    if (!window.gapi) {
      throw new Error('gapi_load_error');
    }
    return getGapiAuthToken(interactive);
  };
  if (window.gapi) {
    return onGAPI();
  } else {
    return new Promise((resolve) => {
      window.gapiOnClientLoad = () => {
        resolve(onGAPI());
      };
    });
  }
};

const getGapiAuthToken = async (interactive: boolean) => {
  const auth2 = window.gapi.auth2.getAuthInstance();
  let user: gapi.auth2.GoogleUser;
  if (interactive) {
    user = await auth2.signIn();
  } else {
    user = auth2.currentUser.get();
  }
  const auth = user.getAuthResponse(true);
  return auth.access_token;
};

let bcSingleton: null | BroadcastChannel = null;
const getChannel = () => {
  if (!bcSingleton && 'BroadcastChannel' in window) {
    bcSingleton = new BroadcastChannel('internal');
  }

  return bcSingleton;
};

export const broadcastLogin = () => {
  getChannel()?.postMessage({ type: 'login' });
};

export const onLogin = (cb: () => void) => {
  const listener = (ev: MessageEvent) => {
    if (typeof ev.data !== 'object') {
      captureMessage(`Unexpected internal broadcast`, {
        extra: { data: ev.data },
      });
      return;
    }
    if (ev.data.type === 'login') {
      cb();
    }
  };
  const bc = getChannel();
  if (bc) {
    bc.addEventListener('message', listener);
    return () => bc.removeEventListener('message', listener);
  }
};
