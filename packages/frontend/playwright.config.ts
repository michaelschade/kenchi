import { PlaywrightTestConfig } from '@playwright/test';
import path from 'path';

import type { TestFixtures } from './playwright_tests/helpers/fixtures';

const extensionPath = path.join(
  __dirname,
  '..',
  'extension',
  'build-playwright'
);

const WEBSERVER_PORT = 3123;
const config: PlaywrightTestConfig<TestFixtures> = {
  forbidOnly: !!process.env.CI, // do not allow describe.only & test.only
  use: {
    baseURL: 'https://api.kenchi.dev',
    webserverURL: `http://localhost:${WEBSERVER_PORT}`,
  },
  webServer: {
    // CI has a separate build step
    command: process.env.CI
      ? `serve -c playwright-serve.json -p ${WEBSERVER_PORT}`
      : 'pnpm start',
    port: WEBSERVER_PORT,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: { PORT: `${WEBSERVER_PORT}`, NODE_ENV: 'test' },
  },
  projects: [
    {
      name: 'browser',
      testDir: './playwright_tests/browser',
      use: { loadExtension: false },
    },
    {
      name: 'extension',
      testDir: './playwright_tests/extension',
      use: {
        loadExtension: true,
        headless: false,
        launchOptions: {
          args: [
            `--load-extension=${extensionPath}`,
            `--disable-extensions-except=${extensionPath}`,
            // If I disable the startup window then playwright hangs and never opens a page for the test.
            // '--no-startup-window',
          ],
        },
      },
    },
  ],
};
export default config;
