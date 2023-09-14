import * as Sentry from '@sentry/gatsby';

Sentry.init({
  dsn: process.env.GATSBY_SENTRY_DSN,
  environment: process.env.GATSBY_ENV,
  enabled: process.env.NODE_ENV !== 'development',
});
