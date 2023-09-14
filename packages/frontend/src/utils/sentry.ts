import * as Sentry from '@sentry/react';
import { captureException } from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import {
  forgivingLocalGet,
  forgivingLocalSet,
  isDevelopment,
  isTest,
  safeURL,
} from '.';

export function initSentry() {
  if (isDevelopment() || isTest()) {
    return;
  }
  definitelyInitSentry();
}

export function definitelyInitSentry() {
  const tracesSampleRate = 0.005;

  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    release: process.env.REACT_APP_SENTRY_VERSION,
    environment: process.env.REACT_APP_ENV,
    ignoreErrors: ['ResizeObserver loop limit exceeded'],
    beforeBreadcrumb,
    integrations: [
      new BrowserTracing({
        // tracingOrigins matches against the entire url, not just the domain.
        // Limit tracing just to graphql requests
        tracingOrigins: [
          'api.staging.kenchi.dev/graphql',
          'api.kenchi.dev/graphql',
          'api.kenchi.com/graphql',
        ],
        // TODO: We may want to add a beforeNavigate to transform the names of the traces. It accepts a context with this shape:
        //   {
        //     "name": "/spaces/all",
        //     "op": "pageload",
        //     "metadata": {
        //         "source": "url",
        //         "baggage": [
        //             {},
        //             "",
        //             true
        //         ]
        //     },
        //     "trimEnd": true
        // }
      }),
    ],
    tracesSampleRate,
  });
  Sentry.configureScope((scope) => {
    try {
      const cachedUser = forgivingLocalGet('sentry-user');
      if (cachedUser) {
        scope.setUser(JSON.parse(cachedUser));
      }
    } catch (error) {
      captureException(error);
    }
  });
}

export function beforeBreadcrumb(
  breadcrumb: Sentry.Breadcrumb,
  hint?: Sentry.BreadcrumbHint | undefined
): Sentry.Breadcrumb | null {
  if (breadcrumb.category === 'console') {
    if (breadcrumb.level === 'debug') {
      return null;
    }
    if (
      breadcrumb.data &&
      Array.isArray(breadcrumb.data.arguments) &&
      breadcrumb.data.arguments.length > 0
    ) {
      if (breadcrumb.message === breadcrumb.data.arguments[0]) {
        if (breadcrumb.data.arguments.length === 1) {
          delete breadcrumb.data.arguments;
        } else {
          breadcrumb.data.arguments.shift();
        }
      }
    }
  } else if (breadcrumb.category === 'fetch' && breadcrumb.type === 'http') {
    if (breadcrumb.data) {
      const url = safeURL(breadcrumb.data.url);
      if (url?.pathname === '/graphql') {
        // handled by SentryLink
        return null;
      } else if (url?.host.endsWith('algolia.net')) {
        breadcrumb.data.url = breadcrumb.data.url.replace(
          /x-algolia-api-key=[^&]*/,
          'x-algolia-api-key=<<REDACTED>>'
        );
      }
    }
  } else if (breadcrumb.category === 'ui.click' && hint) {
    // Overwrite Sentry's default ui.click message (chain of CSS selectors)
    // to something more useful (inner text/label of the thing being clicked).
    //
    // We're making a lot of assumptions here about `hint.event` being a DOM
    // event with an element target, so let's wrap in a try/catch to
    // fallback on default behavior if any of this fails (e.g. custom
    // DOM events).
    try {
      // Use `currentTarget` instead of `target` as that is what the event
      // is bound to, and will likely contain the text we want to extract.
      const currentTarget = hint.event.currentTarget as HTMLElement;
      const innerText = currentTarget.innerText
        .replace(/\s\s+|[\r\n]+/g, '  ')
        .trim();
      const text = innerText
        ? `"${innerText.replace(/^(.{50}).+/, '$1…')}"`
        : '<empty>';
      const tagName = currentTarget.tagName.toLowerCase();
      const id = currentTarget.id ? `#${currentTarget.id}` : '';
      const title = currentTarget.title
        ? `[title="${currentTarget.title}"]`
        : '';
      breadcrumb.message = `${tagName}${id}${title} > ${text}`;
    } catch (e) {
      // continue with default behavior
    }
  }
  return breadcrumb;
}

export function setSentryUser(user: { id: string; email?: string | null }) {
  const userInfo = { id: user.id, email: user.email ? user.email : undefined };
  forgivingLocalSet(
    'sentry-user',
    JSON.stringify({ ...userInfo, cached: true })
  );
  Sentry.configureScope((scope) => {
    scope.setUser({ ...userInfo, cached: false });
  });
}
