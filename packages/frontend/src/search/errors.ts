import type { RetryError, StackFrame } from '@algolia/transporter';
import { captureException } from '@sentry/react';

export const isAlgoliaRetryError = (error: any): error is RetryError => {
  return (
    typeof error.name === 'string' &&
    typeof error.message === 'string' &&
    Array.isArray(error.transporterStackTrace)
  );
};

export const serializeTransporterStackTrace = (
  trace: readonly StackFrame[]
) => {
  return trace.map((frame) => ({
    host: frame.host.protocol + frame.host.url,
    query: frame.request.data,
    response: frame.response.content,
    status: frame.response.status,
  }));
};

export const captureAlgoliaRetryError = (error: RetryError): string => {
  return captureException(new Error(error.message), {
    extra: {
      name: error.name,
      transporterStackTrace: serializeTransporterStackTrace(
        error.transporterStackTrace
      ),
    },
  });
};
