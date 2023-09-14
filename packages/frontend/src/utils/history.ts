import { addBreadcrumb, captureMessage } from '@sentry/react';
import {
  createBrowserHistory,
  createMemoryHistory,
  createPath,
  History,
  LocationDescriptorObject,
} from 'history';
import { parse, stringify } from 'qs';

import { Commands } from '@kenchi/commands';

import { CollectionListItemFragment } from '../graphql/generated';
import { forgivingSessionSet, isExtension } from '.';
import { trackPageview } from './analytics';
import { isTool, isWorkflow, VersionedNodeTypename } from './versionedNode';

type IChangeLocation<S> = {
  (path: string, state?: S): void;
  (loc: LocationDescriptorObject<S>): void;
};

const FROM_RELOAD_QUERY_KEY = 'fromReload';
const MAX_RELOAD_FREQUENCY = 3 * 60 * 1000; // 3m
let lastReloadTime: number | null = null;

// It's possible we'd run `initialMemoryEntries` twice, either because of future
// React concurrency or because of React.StrictMode. We want to make sure it has
// the same effect on multiple runs, so we need to store the hash in a
// permanent-ish manner (rather than clearing it when `initialMemoryEntries` is
// called).
const originalHash = window.location.hash;
window.location.hash = '';

const initialMemoryEntries = () => {
  if (originalHash.startsWith('#/')) {
    lastReloadTime = new Date().getTime();
    const start = originalHash.substring(1);
    console.log('Came from reload, setting initial location', start);
    if (start === '/') {
      return ['/'];
    } else {
      return ['/', start];
    }
  } else {
    // Extension loads always start on empty so we can initialize the global
    // state (e.g. the things that let us open the iframe) ASAP. We'll move from
    // /empty to / once that loads.
    return ['/empty'];
  }
};

export const reloadWithLocation = (
  path: string | LocationDescriptorObject<any>
) => {
  // We could have a long-lived window that only gets reloaded automatically,
  // only get worried about a loop if we're reloading again within 3m.
  if (
    lastReloadTime &&
    lastReloadTime > new Date().getTime() - MAX_RELOAD_FREQUENCY
  ) {
    captureMessage('Trying to reload multiple times, possible reload loop');
    console.log(`Trying to reload multiple times, possible reload loop`);
    return false;
  }
  let dest;
  if (typeof path === 'string') {
    dest = path;
  } else {
    dest = path.pathname || '';
    if (path.search) {
      dest += `?${path.search}&${FROM_RELOAD_QUERY_KEY}=true`;
    } else {
      dest += `?${FROM_RELOAD_QUERY_KEY}=true`;
    }
  }
  if (isExtension()) {
    window.location.hash = dest;
    window.location.reload();
  } else {
    window.location.href = dest;
  }
  return true;
};

export type State = {
  // If we're going back from this page, how many additional steps should we go
  // back?
  goBackSkip?: number;
  proposedSnippet?: Commands['app']['proposeNewSnippet']['args'];
};

const shouldSkipPath = (path: string) =>
  path.includes('/edit/') || path.endsWith('/edit') || path.endsWith('/new');

const augmentGoBack = (history: History<State>) => {
  const { push, replace } = history;

  // +1 to skip value if we should skip
  history.push = (
    path: string | LocationDescriptorObject<State>,
    state?: State
  ) => {
    const goBackSkip = shouldSkipPath(history.location.pathname)
      ? 1 + (history.location.state?.goBackSkip || 0)
      : 0;
    if (typeof path === 'string') {
      state = state || {};
      state.goBackSkip = state.goBackSkip || goBackSkip;
      push(path, state);
    } else {
      path.state = path.state || {};
      path.state.goBackSkip = path.state.goBackSkip || goBackSkip;
      push(path);
    }
  };

  // Preserve skip value
  history.replace = (
    path: string | LocationDescriptorObject<State>,
    state?: State
  ) => {
    const goBackSkip = history.location.state?.goBackSkip;
    if (typeof path === 'string') {
      state = state || {};
      state.goBackSkip = state.goBackSkip || goBackSkip;
      replace(path, state);
    } else {
      path.state = path.state || {};
      path.state.goBackSkip = path.state.goBackSkip || goBackSkip;
      replace(path);
    }
  };
  history.goBack = () => {
    // We never want to go back past the first page of our SPA, so if we haven't
    // navigated with state silently do nothing.
    if (history.location.state) {
      const goBackSkip = -1 - (history.location.state.goBackSkip || 0);
      history.go(goBackSkip);
    }
  };
};

const wrapChangeLocation = (
  history: History<State>,
  orig: IChangeLocation<State>
): IChangeLocation<State> => {
  return (path: string | LocationDescriptorObject<State>, state?: State) => {
    // If we have an activated service worker make the next navigation actually
    // navigate so we get reloaded
    if (window.needsUpdate) {
      console.log('Making navigation reload due to recently activated update');
      reloadWithLocation(path);
      return;
    }

    // If we hit an error boundary, reload on navigation as well. This makes it
    // so the links in the dashboard sidebar will work even if the app has
    // crashed.
    if (window.didHitErrorBoundary) {
      console.log(
        'Making app reload on navigation after hitting error boundary'
      );
      reloadWithLocation(path);
      return;
    }

    // Save Y-scroll so when we go back we can restore it
    forgivingSessionSet(`scrollY:${history.location.key}`, `${window.scrollY}`);

    // Extension doesn't give breadcrumbs because we use memory navigation
    if (isExtension()) {
      addBreadcrumb({
        category: 'url',
        data: { path },
        level: 'info',
      });
    }

    if (typeof path === 'string') {
      orig(path, state);
    } else {
      orig(path);
    }
  };
};

export function initHistory(useMemory: boolean) {
  // browser history in an iframe affects the global history. Since we put
  // our own back buttons on everything manage history ourselves instead.
  let h;
  if (useMemory) {
    const initialEntries = initialMemoryEntries();
    h = createMemoryHistory<{}>({
      initialEntries,
      initialIndex: initialEntries.length - 1,
    });
  } else {
    const query = parse(window.location.search.substr(1));
    lastReloadTime =
      FROM_RELOAD_QUERY_KEY in query ? new Date().getTime() : null;
    if (lastReloadTime) {
      delete query[FROM_RELOAD_QUERY_KEY];
      const queryString =
        Object.keys(query).length > 0 ? `?${stringify(query)}` : '';
      window.location.replace(`${window.location.pathname}${queryString}`);
    }
    h = createBrowserHistory<{}>();
  }
  h.listen((location) => {
    trackPageview(createPath(location));
  });
  // Listen doesn't trigger for initial load.
  trackPageview(createPath(h.location));
  h.push = wrapChangeLocation(h, h.push);
  augmentGoBack(h);
  return h;
}

type NavigatableVersionedNode = {
  __typename: VersionedNodeTypename;
  staticId: string;
  branchId: string | null;
};

export function sendToView(
  history: History<any>,
  obj: NavigatableVersionedNode | CollectionListItemFragment,
  queryParams?: Record<string, any>
) {
  history.push(getPath(obj, undefined, queryParams));
}

export function sendToDashboardView(
  history: History<any>,
  obj: NavigatableVersionedNode | CollectionListItemFragment,
  queryParams?: Record<string, any>
) {
  history.push(getPath(obj, undefined, queryParams, true));
}

export function sendToEdit(
  history: History<any>,
  obj: NavigatableVersionedNode,
  queryParams?: Record<string, any>
) {
  history.push(getPath(obj, 'edit', queryParams));
}

export function sendToDashboardEdit(
  history: History<any>,
  obj: NavigatableVersionedNode,
  queryParams?: Record<string, any>
) {
  history.push(getPath(obj, 'edit', queryParams, true));
}

export function getPath(
  obj: NavigatableVersionedNode | CollectionListItemFragment,
  afterStaticId?: string,
  queryParams?: Record<string, any>,
  inDashboard?: boolean
) {
  let prefix;
  if (obj.__typename === 'Collection') {
    prefix = 'collections';
  } else if (isTool(obj)) {
    prefix = 'snippets';
  } else if (isWorkflow(obj)) {
    prefix = 'playbooks';
  }

  if (inDashboard) {
    prefix = `dashboard/${prefix}`;
  }

  afterStaticId = afterStaticId ? `/${afterStaticId}` : ``;
  const query = queryParams ? `?${stringify(queryParams)}` : '';

  if (obj.__typename === 'Collection') {
    return `/${prefix}/${obj.id}${afterStaticId}${query}`;
  } else if (obj.branchId) {
    return `/${prefix}/${obj.staticId}${afterStaticId}/${obj.branchId}${query}`;
  } else {
    return `/${prefix}/${obj.staticId}${afterStaticId}${query}`;
  }
}
