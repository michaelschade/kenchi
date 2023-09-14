import * as Sentry from '@sentry/browser';

export function initSentry() {
  if (process.env.APP_ENV === 'development') {
    return;
  }
  Sentry.init({
    dsn: 'https://9a848a9508d74f38b1e52dab2b9a7392@sentry.io/2047652',
    release: process.env.SENTRY_VERSION,
    environment: process.env.APP_ENV,
    beforeSend: (event) => {
      if (
        event.exception &&
        event.exception.values &&
        event.exception.values.length > 0
      ) {
        const exception = event.exception.values[0];
        if (exception.value === 'ResizeObserver loop limit exceeded') {
          console.log('Not reporting ResizeObserver error');
          return null;
        } else if (exception.value === 'waitFor timeout') {
          if (
            exception.stacktrace?.frames?.[0].filename?.endsWith(
              '/build/platform-implementation.js'
            )
          ) {
            console.log('Not reporting InboxSDK waitFor timeout error');
            return null;
          }
        }
      }

      return event;
    },
  });
}
