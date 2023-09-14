import { App } from './types';

// To get the app's current ticketId (never changes, a new "app" is created for each ticket):
//   const { instances } = await handleRequest(sidebarRuntime, app, 'get', [
//     'instances',
//   ]);
//   const instance = (instances as any)[app.guid()];
//   const ticketId = instance.ticketId;

export function handleLocalRequest(
  runtime: any,
  app: App,
  method: 'get',
  args: string[]
): Promise<Record<string, unknown>>;
export function handleLocalRequest(
  runtime: any,
  app: App,
  method: 'invoke' | 'set',
  args: Record<string, any>
): Promise<Record<string, unknown>>;
export function handleLocalRequest(
  runtime: any,
  app: App,
  method: string,
  args: string[] | Record<string, any>
): Promise<Record<string, unknown>> {
  return runtime.apiRouter.handleRequest(app, method, args);
}
