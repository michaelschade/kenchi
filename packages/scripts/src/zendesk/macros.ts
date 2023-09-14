import { Commands } from '@kenchi/commands';
import { failure, isFailure, success } from '@kenchi/shared/lib/Result';

import { getPaginated } from './apiRequest';
import { getApp, getRuntime } from './runtime';

export async function getMacros(): Promise<
  Commands['pageScript']['zendeskGetMacros']['resp']
> {
  const runtime = getRuntime((r) => r.location === 'background' && r.isActive);
  if (!runtime) {
    return failure({
      message: 'Must be logged in and on main Zendesk app',
      partial: [],
    });
  }

  const app = await getApp(runtime);

  let macros: any[] = [];
  const result = await getPaginated(app, '/api/v2/macros.json', (data) => {
    macros = macros.concat(data.macros);
  });
  if (isFailure(result)) {
    return failure({ message: result.error, partial: macros });
  }

  return success(macros);
}
