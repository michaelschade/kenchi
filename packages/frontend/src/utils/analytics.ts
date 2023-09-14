import { addBreadcrumb } from '@sentry/react';
import debug from 'debug';
import debounce from 'lodash/debounce';
import { parse } from 'qs';

import { isTest } from '.';

const log = debug('kenchi:analytics');
log.log = console.log;

const LOG_URL = `${process.env.REACT_APP_API_HOST}/q`;

type AnalyticsState = {
  pageUrl: string | null;
  path: string | null;
  sessionId: string | null;
  extensionVersion: string | undefined;
  appVersion: string | undefined;
  object?: string;
};
const state: AnalyticsState = {
  pageUrl: null,
  path: null,
  sessionId: null,
  extensionVersion: parse(globalThis.location?.search.substring(1) || '')
    .version as string | undefined,
  appVersion: process.env.REACT_APP_SENTRY_VERSION,
};

export function setAnalyticsPageUrl(url: string) {
  state.pageUrl = url;
}

export function setSessionId(id: string) {
  state.sessionId = id;
}

type TrackEventOpts = {
  category: string;
  action: string;
  label?: string;
  [key: string]: unknown;
};
export function trackEvent(event: TrackEventOpts) {
  queueLogEntry('user', event);
}

export function trackPageview(path: string) {
  state.path = path;
  // Extract object IDs from URLs where possible
  const match = path.match(/((wrkf|tool)_\w+)/);
  if (match) {
    state.object = match[1];
  } else {
    delete state.object;
  }
  addBreadcrumb({
    category: 'url',
    level: 'info',
    data: { path },
  });
  queueLogEntry('user', { action: 'page_view', path });
}

const genTelemetryId = () => `${Math.round(Math.random() * 10000000)}`;
const traceId = genTelemetryId();

export type Span = {
  id: string;
  end: (data?: Record<string, unknown>) => void;
};
export function trackSpan(
  name: string,
  data?: Record<string, unknown>,
  parent?: Span
): Span {
  const id = genTelemetryId();
  const start = new Date().getTime();
  return {
    id,
    end: (endData?: Record<string, unknown>) => {
      const duration_ms = new Date().getTime() - start;
      trackTelemetry(
        name,
        {
          ...data,
          ...endData,
          'trace.span_id': id,
          'trace.parent_id': parent?.id,
          duration_ms,
        },
        start
      );
    },
  };
}

export function trackTelemetry(
  name: string,
  data: Record<string, unknown>,
  timestamp?: number
) {
  log(`[telemetry] ${name}`, data);

  queueLogEntry(
    'telemetry',
    { ...data, name, 'trace.trace_id': traceId },
    timestamp
  );
}

type LogType = 'user' | 'telemetry';
type LogEntry = {
  type: LogType;
  timestamp: number;
  data: Record<string, unknown>;
};

let queue: LogEntry[] = [];

function queueLogEntry(
  type: LogType,
  data: Record<string, unknown>,
  timestamp?: number
) {
  if (isTest()) {
    return;
  }

  const improvedData = {
    ...state,
    ...data,
  };
  queue.push({
    type,
    timestamp: timestamp || new Date().getTime(),
    data: improvedData,
  });
  sendLogs();
}

const MAX_LOG_BATCH_SIZE = 100;

const sendLogs = debounce(
  () => {
    if (queue.length === 0) {
      return;
    }
    const logs = queue.slice(0, MAX_LOG_BATCH_SIZE);
    queue = queue.slice(MAX_LOG_BATCH_SIZE);

    const formData = new URLSearchParams();
    formData.append('data', JSON.stringify(logs));
    const success = navigator.sendBeacon(LOG_URL, formData);
    if (!success) {
      // Return to queue and make sure we try again in a bit
      queue.push(...logs);
      window.setTimeout(() => sendLogs(), 2000);
    } else if (queue.length > 0) {
      sendLogs();
    }
  },
  200,
  { maxWait: 2000 }
);

// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#sending_analytics_at_the_end_of_a_session
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    sendLogs.flush();
  }
});
