import { setupAppForApiRequests } from './apiRequest';
import { App, Runtime } from './types';

export function getRuntime(matcher: (r: Runtime) => boolean): Runtime | null {
  // @ts-ignore
  const ZendeskApps = window.ZendeskApps;
  if (!ZendeskApps) {
    return null;
  }
  const runtimes = ZendeskApps.AppRuntime._globalRuntimes;
  return runtimes.find(matcher);
}

const appForRuntime: WeakMap<Runtime, App> = new WeakMap();
export async function getApp(runtime: Runtime): Promise<App> {
  if (appForRuntime.has(runtime)) {
    return appForRuntime.get(runtime)!;
  }

  // @ts-ignore
  const ZendeskApps = window.ZendeskApps;
  if (!ZendeskApps) {
    throw new Error(
      'ZendeskApps not found, should be impossible if you found a runtime'
    );
  }

  const appKlass = ZendeskApps.defineApp(null)
    .reopenClass({
      experiments: {},
      location: {
        support: {
          ticket_sidebar: {
            url: `${process.env.SCRIPTS_HOST}/zendesk/blank.html`,
            autoHide: true,
          },
          background: {
            url: `${process.env.SCRIPTS_HOST}/zendesk/blank.html`,
            autoHide: true,
          },
        },
      },
      noTemplate: ['ticket_sidebar'],
      singleInstall: false,
      signedUrls: false,
    })
    .reopen({
      appName: '',
      appVersion: '1.0.0',
      author: {
        name: 'Zendesk',
        email: 'support@zendesk.com',
      },
      frameworkVersion: '2.0',
    });
  // TODO: maybe override logger
  // app.logger = {
  //   _messages: loggerMessages,
  //   increment: log,
  //   warn: log,
  //   error: log,
  // };
  const installation = ZendeskApps.InstalledApp.push(appKlass, {
    settings: { title: 'Kenchi' },
  });
  const { app } = await runtime.launchApp(installation);

  setupAppForApiRequests(app);

  appForRuntime.set(runtime, app);
  if (process.env.APP_ENV === 'development') {
    // To make debugging easier
    // @ts-ignore
    window.lastApp = app;
  }
  return app;
}
