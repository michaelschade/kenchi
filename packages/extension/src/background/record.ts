import { captureMessage } from '@sentry/browser';
import qs from 'qs';

import { KenchiMessageRouter, RecordingNetworkRequest } from '@kenchi/commands';
import { failure, success } from '@kenchi/shared/lib/Result';

import { maybeInject } from '.';

class Recording {
  public lastUrl: string | null = null;
  public requests: RecordingNetworkRequest[] = [];
  public isClosed = false;
  public isPaused = false;

  private removeListenerCallback: () => void;
  private requestDetails: Record<
    string,
    {
      rawRequestBody?: chrome.webRequest.WebRequestBody;
      rawRequestHeaders?: chrome.webRequest.HttpHeader[];
      startedAt?: number;
    }
  > = {};

  constructor(public windowId: number) {
    const onDOMContentLoaded = (
      details: chrome.webNavigation.WebNavigationFramedCallbackDetails
    ) => this.onDOMContentLoaded(details.tabId);
    chrome.webNavigation.onDOMContentLoaded.addListener(onDOMContentLoaded);

    const filter: chrome.webRequest.RequestFilter = {
      types: ['main_frame', 'sub_frame', 'xmlhttprequest'],
      urls: ['<all_urls>'],
      windowId,
    };

    const onBeforeRequest = (
      details: chrome.webRequest.WebRequestBodyDetails
    ) => this.onBeforeRequest(details);
    chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, filter, [
      'requestBody',
    ]);

    const onSendHeaders = (
      details: chrome.webRequest.WebRequestHeadersDetails
    ) => this.onRequestSendHeaders(details);
    chrome.webRequest.onSendHeaders.addListener(onSendHeaders, filter, [
      'requestHeaders',
      'extraHeaders',
    ]);

    const onCompleted = (details: chrome.webRequest.WebResponseCacheDetails) =>
      this.onRequestCompleted(details);
    chrome.webRequest.onCompleted.addListener(onCompleted, filter, [
      'responseHeaders',
    ]);

    this.removeListenerCallback = () => {
      chrome.webNavigation.onDOMContentLoaded.removeListener(
        onDOMContentLoaded
      );
      chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
      chrome.webRequest.onSendHeaders.removeListener(onSendHeaders);
      chrome.webRequest.onCompleted.removeListener(onCompleted);
    };
  }

  public destroy() {
    this.removeListenerCallback();
  }

  private onDOMContentLoaded(tabId: number) {
    chrome.tabs.get(tabId, (tab) => {
      if (this.windowId !== tab.windowId) {
        return;
      }
      maybeInject(tabId, { inject: true, injectGmail: false }, true);
    });
  }

  private onBeforeRequest(details: chrome.webRequest.WebRequestBodyDetails) {
    if (shouldIgnoreUrl(details.url) || this.isPaused) {
      return;
    }
    this.requestDetails[details.requestId] ||= {};
    this.requestDetails[details.requestId].rawRequestBody =
      details.requestBody!;
    this.requestDetails[details.requestId].startedAt = new Date().getTime();
  }

  private onRequestSendHeaders(
    details: chrome.webRequest.WebRequestHeadersDetails
  ) {
    if (shouldIgnoreUrl(details.url)) {
      return;
    }
    this.requestDetails[details.requestId] ||= {};
    this.requestDetails[details.requestId].rawRequestHeaders =
      details.requestHeaders!;
  }

  private async onRequestCompleted(
    details: chrome.webRequest.WebResponseCacheDetails
  ) {
    const { requestId, url, method, statusCode } = details;
    if (shouldIgnoreUrl(url)) {
      return;
    }
    const completedAt = new Date().getTime();
    const { rawRequestHeaders, rawRequestBody, startedAt } =
      this.requestDetails[requestId] || {};
    delete this.requestDetails[requestId];

    const keepHeader = (name: string) => {
      const lcName = name.toLowerCase();
      if (lcName === 'cookie') {
        return false;
      }
      if (lcName.startsWith('sec-ch-')) {
        return false;
      }
      if (lcName === 'user-agent') {
        return false;
      }
      return true;
    };
    const requestHeaders = Object.fromEntries(
      rawRequestHeaders
        ?.filter((h) => h.value !== undefined && keepHeader(h.name))
        .map((h) => [h.name.toLowerCase(), h.value!]) || []
    );
    const responseHeaders = Object.fromEntries(
      details.responseHeaders?.map((h) => [h.name.toLowerCase(), h.value!]) ||
        []
    );

    const hasCookies = rawRequestHeaders?.some(
      ({ name }) => name.toLowerCase() === 'cookie'
    );
    const credentials: 'include' | 'omit' = hasCookies ? 'include' : 'omit';

    let requestBodyForLog: Record<string, unknown> | string | null;
    let body = undefined;
    const contentType = requestHeaders['content-type'] as string | undefined;
    if (rawRequestBody?.formData) {
      requestBodyForLog = rawRequestBody.formData;
      if (contentType?.startsWith('multipart/form-data')) {
        const formData = new FormData();
        for (let [key, values] of Object.entries(rawRequestBody.formData)) {
          values.forEach((v) => formData.append(key, v));
        }
        body = formData;
      } else {
        body = qs.stringify(rawRequestBody.formData);
      }
    } else if (rawRequestBody?.raw) {
      const decoder = new TextDecoder();
      let bodyString = '';
      rawRequestBody.raw.forEach((b) => {
        bodyString += decoder.decode(b.bytes, { stream: true });
      });
      bodyString += decoder.decode();
      if (contentType?.startsWith('application/json')) {
        try {
          requestBodyForLog = JSON.parse(bodyString);
        } catch (e) {
          requestBodyForLog = bodyString;
        }
      } else {
        requestBodyForLog = bodyString;
      }

      const buffers = rawRequestBody.raw
        .map((b) => b.bytes)
        .filter(<T>(b: T | undefined): b is T => b !== undefined);
      const arr = new Uint8Array(
        buffers.reduce((acc, b) => acc + b.byteLength, 0)
      );
      let prevLength = 0;
      for (const b of buffers) {
        arr.set(new Uint8Array(b), prevLength);
        prevLength += b.byteLength;
      }
      body = arr.buffer;
    } else if (rawRequestBody?.error) {
      console.log('Unable to record request body:', url, rawRequestBody.error);
      return;
    } else {
      requestBodyForLog = null;
    }
    const resp = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      credentials,
      body,
    });
    let responseBody;
    if (responseHeaders['content-type'] === 'application/json') {
      try {
        responseBody = await resp.json();
      } catch (e) {
        responseBody = await resp.text();
      }
    } else {
      responseBody = await resp.text();
    }

    this.requests.push({
      id: details.requestId,
      startedAt: startedAt!,
      completedAt,
      url,
      method,
      credentials,
      requestHeaders,
      requestBody: requestBodyForLog,
      originalStatus: statusCode,
      status: resp.status,
      responseHeaders,
      responseBody,
    });
  }
}

let activeRecording: Recording | null = null;

function shouldIgnoreUrl(urlStr: string) {
  let url;
  try {
    url = new URL(urlStr);
  } catch (e) {
    // ??
    return false;
  }

  if (url.origin === process.env.APP_HOST) {
    return true;
  }

  if (url.host === 'r.stripe.com') {
    return true;
  }
  if (
    url.host === 'dashboard.stripe.com' &&
    url.pathname.startsWith('/ajax/metrics')
  ) {
    return true;
  }
  if (url.host === 'stats.g.doubleclick.net') {
    return true;
  }
  return false;
}

function recordWindow(windowId: number) {
  activeRecording = new Recording(windowId);
}

function cancelRecording() {
  if (activeRecording) {
    activeRecording.destroy();
    activeRecording = null;
  }
}

export function isRecording(tab: chrome.tabs.Tab) {
  return tab.windowId === activeRecording?.windowId;
}

export function getRecordingSettings(tab: chrome.tabs.Tab) {
  if (!activeRecording || !isRecording(tab)) {
    return null;
  }
  return {
    isPaused: activeRecording.isPaused,
    initialStyle: null,
  };
}

export function setupRecordListeners(
  router: KenchiMessageRouter<'background'>
) {
  chrome.windows.onRemoved.addListener((windowId) => {
    if (activeRecording && activeRecording.windowId === windowId) {
      activeRecording.isClosed = true;
    }
  });

  router.addCommandHandler(
    'dashboard',
    'recordStart',
    () =>
      new Promise<void>((resolve) => {
        chrome.windows.create(
          {
            focused: true,
            url: `${process.env.APP_HOST}/record`,
          },
          (window) => {
            if (window?.id === undefined) {
              captureMessage('Failed to create recording window');
              return;
            }
            recordWindow(window.id);
            resolve();
          }
        );
      })
  );

  router.addCommandHandler(
    'contentScript',
    'recordDone',
    async ({ sender }) => {
      if (!activeRecording) {
        return failure('no_active_recording');
      }

      const lastUrl = sender?.tab?.url;
      if (!lastUrl) {
        return failure('no_url');
      }

      activeRecording.lastUrl = lastUrl;

      chrome.windows.remove(activeRecording.windowId);

      return success('marked_done');
    }
  );

  router.addCommandHandler('dashboard', 'recordProcessPoll', async () => {
    if (activeRecording) {
      if (activeRecording.lastUrl) {
        const data = {
          networkRequests: activeRecording.requests,
          lastUrl: activeRecording.lastUrl,
        };
        cancelRecording();
        return success(data);
      } else if (activeRecording.isClosed) {
        cancelRecording();
        return failure('window_closed');
      } else {
        return failure('not_finished');
      }
    } else {
      return failure('no_active_recording');
    }
  });

  router.addCommandHandler(
    ['contentScript', 'dashboard'],
    'recordCancel',
    async () => {
      cancelRecording();
    }
  );

  router.addCommandHandler('contentScript', 'recordPause', async () => {
    if (activeRecording) {
      activeRecording.isPaused = true;
    }
  });

  router.addCommandHandler('contentScript', 'recordResume', async () => {
    if (activeRecording) {
      activeRecording.isPaused = false;
    }
  });
}
