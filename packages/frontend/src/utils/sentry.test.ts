import { configureScope } from '@sentry/react';

import { forgivingLocalSet } from '.';
import {
  beforeBreadcrumb,
  definitelyInitSentry,
  setSentryUser,
} from './sentry';

describe('Setting the user', () => {
  beforeEach(() => {
    localStorage.clear();
    configureScope((scope) => scope.setUser(null));
  });

  it('caches the user in local storage', () => {
    const user = { id: '8675309', email: 'user@example.com' };
    setSentryUser(user);
    expect(localStorage.getItem('sentry-user')).toEqual(
      JSON.stringify({ ...user, cached: true })
    );
  });

  it('replaces an existing cached user', () => {
    const cachedUser = {
      id: '8675309',
      email: 'user@example.com',
      cached: true,
    };

    configureScope((scope) => {
      scope.setUser(cachedUser);
    });
    const user = { id: '8675309', email: 'user@example.com' };
    setSentryUser(user);
    configureScope((scope) => {
      expect(scope.getUser()).toEqual({ ...user, cached: false });
    });
  });
});

describe('Initializing sentry', () => {
  beforeEach(() => {
    localStorage.clear();
    configureScope((scope) => scope.setUser(null));
  });

  it('initializes with a cached user', () => {
    const cachedUser = {
      id: '8675309',
      email: 'cachemeow@kittenlab.com',
      cached: true,
    };
    forgivingLocalSet('sentry-user', JSON.stringify(cachedUser));
    definitelyInitSentry();
    configureScope((scope) => {
      expect(scope.getUser()).toEqual(cachedUser);
    });
  });

  it('initializes without a cached user', () => {
    definitelyInitSentry();
    configureScope((scope) => {
      expect(scope.getUser()).toEqual({});
    });
  });

  it('initializes if the cached user is invalid', () => {
    forgivingLocalSet('sentry-user', '{nope-not-valid-json');
    definitelyInitSentry();
    configureScope((scope) => {
      expect(scope.getUser()).toEqual({});
    });
  });
});

describe('Automatic breadcrumbs', () => {
  it('Does not send breadcrumbs for GQL requests', async () => {
    const breadcrumb = beforeBreadcrumb({
      category: 'fetch',
      type: 'http',
      data: {
        method: 'GET',
        url: 'https://api.kenchi.com/graphql?query={__typename}',
      },
    });
    expect(breadcrumb).toBeNull();
  });

  it('Redacts Algolia API keys', async () => {
    const breadcrumb = beforeBreadcrumb({
      category: 'fetch',
      type: 'http',
      data: {
        method: 'POST',
        url: 'https://O8RWDUT387-dsn.algolia.net/1/indexes/prod_app_index/query?x-algolia-agent=SOME_AGENT&x-algolia-api-key=SOME_KEY&x-algolia-application-id=O8RWDUT387',
      },
    });
    expect(breadcrumb?.data?.url).toEqual(
      'https://O8RWDUT387-dsn.algolia.net/1/indexes/prod_app_index/query?x-algolia-agent=SOME_AGENT&x-algolia-api-key=<<REDACTED>>&x-algolia-application-id=O8RWDUT387'
    );
  });
});
