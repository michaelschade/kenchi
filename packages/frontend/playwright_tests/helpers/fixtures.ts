import { BrowserContext, expect, Page, test as base } from '@playwright/test';

import { interceptGraphqlQueries, MockableGraphqlServer } from './graphql';
import mockGapi from './mockGapi';
import { interceptSearchQueries, MockSearchResults } from './search';

// Playwright routes are evaluated in reverse order,
// this catch-all works as long as it's the first route handler we add
// https://github.com/microsoft/playwright/issues/7394
const disableOtherAssets = async (routable: BrowserContext | Page) => {
  await routable.route(
    (_) => true,
    (route, request) => {
      const url = new URL(request.url());

      if (url.hostname.includes('kenchi')) {
        console.warn(
          `URL catch-all intercepted a kenchi URL. We should have an explicit route handler for the shape of request: ${url.toString()}`
        );
      }
      route.abort();
    }
  );
};

const allowChromeExtensionRequests = async (
  routable: BrowserContext | Page
) => {
  await routable.route('chrome-extension://**', async (route, request) => {
    route.continue();
  });
};

// This is essentially a proxy that fulfills asset requests from kenchi.dev
// from the webserver running for playwright
const fulfillDevStaticAssets = async (
  routable: BrowserContext | Page,
  baseUrl: string
) => {
  // This isn't quite right. https://scripts.kenchi.dev is not served from
  // frontend I believe this will only become a problem when we want to test the
  // walkthrough or the hud
  await routable.route('https://*.kenchi.dev/**', async (route, request) => {
    const url = new URL(request.url());
    const newUrl = `${baseUrl}${url.pathname}${url.search}`;
    const originalHeaders = await request.allHeaders();

    const response = await routable.request.fetch(newUrl, {
      method: request.method(),
      data: request.postData(),
      headers: {
        ...originalHeaders,
        Origin: baseUrl,
      },
    });

    const status = response.status();
    const headers = {
      ...response.headers(),
      'X-Playwright-Assets-Proxy': 'true',
    };
    const body = await response.body();

    await route.fulfill({
      status,
      headers,
      body,
    });
  });
};

const interceptTracking = async (routable: BrowserContext | Page) => {
  await routable.route('https://api.kenchi.dev/q', async (route, request) => {
    const origin = await request.headerValue('origin');

    route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'X-Playwright-Tracking-Mock': 'true',
      },
      body: '1',
    });
  });
};

// Some common set up and fixtures for tests that exercise graphql
// - mock all graphql API responses and expose an interface to add mocks and resolvers
// - mock all algolia search requests and expose an interface to manipulate results
// - abort all external API calls and resource fetches. We don't want test runs to make external network requests
// - intercept the https://api.kenchi.dev/q tracking request
export type TestFixtures = {
  loadExtension: boolean;
  webserverURL: string;
  mockGraphqlServer: MockableGraphqlServer;
  mockSearchResults: MockSearchResults;
  activateExtension: () => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  mockGraphqlServer: new MockableGraphqlServer(),
  mockSearchResults: {},
  webserverURL: [null, { option: true }],
  loadExtension: [null, { option: true }],

  activateExtension: async ({ loadExtension, context, page }, use) => {
    if (!loadExtension) {
      throw new Error(
        'Extension-based tests must be in the playwright_tests/extension directory'
      );
    }

    use(async () => {
      const bgPages = context.backgroundPages();
      expect(bgPages.length).toBe(1);
      const bgPage = bgPages[0];

      await bgPage.evaluate(async () => {
        chrome.tabs.query({ lastFocusedWindow: true, active: true }, (tabs) => {
          // @ts-ignore
          chrome.browserAction.onClicked.dispatch(tabs[0]);
        });
      });
      await page.waitForSelector('#kenchi-iframe');
    });
  },

  context: async (
    {
      loadExtension,
      playwright,
      browserName,
      browser,
      webserverURL,
      mockGraphqlServer,
      mockSearchResults,
    },
    use
  ) => {
    let context;
    if (loadExtension) {
      context = await playwright[browserName].launchPersistentContext('', {
        // When the extension is loaded, we have found it does not obey the
        // browser context route capture and it can behave differently depending
        // on whether the app is running in the local dev environment. Start offline
        // and enable the network before passing the context on to the test
        offline: true,
      });
    } else {
      context = await browser.newContext();
    }
    await disableOtherAssets(context);
    await fulfillDevStaticAssets(context, webserverURL);
    if (loadExtension) {
      await allowChromeExtensionRequests(context);
    }
    await interceptGraphqlQueries(context, mockGraphqlServer);
    await interceptSearchQueries(context, mockSearchResults);
    await interceptTracking(context);

    await context.addInitScript(mockGapi, 'FAKE_ACCESS_TOKEN');
    if (loadExtension) {
      const bgPages = context.backgroundPages();
      expect(bgPages.length).toBe(1);
      const bgPage = bgPages[0];

      // The background page does not seem to obey our route interception when it is first created
      mockGraphqlServer.addResolvers({
        Viewer: { installUrl: () => null },
      });
      await disableOtherAssets(bgPage);
      await fulfillDevStaticAssets(bgPage, webserverURL);
      await allowChromeExtensionRequests(bgPage);
      await interceptGraphqlQueries(bgPage, mockGraphqlServer);
      await interceptTracking(bgPage);

      await context.setOffline(false);

      // bgPage.on('console', (msg) => console.log(msg.text()));
      await bgPage.reload();
    }

    await use(context);
    // await context.close();
  },
});

export default test;
