import getMessageRouter from '../getMessageRouter';
import { handleApiRequest } from './apiRequest';
import { assignMe } from './assignMe';
import { handleLocalRequest } from './localRequest';
import { getMacros } from './macros';
import { getRuntime } from './runtime';
import { addTags, extractTags, removeTags, setTags } from './tags';
import { setTicketStatus } from './ticketStatus';
import { getActiveVariables } from './variables';

const router = getMessageRouter();

router.addCommandHandler(
  ['app', 'hud'],
  'zendeskGetActive',
  getActiveVariables
);
router.addCommandHandler(['app'], 'zendeskExtractTags', extractTags);
router.addCommandHandler(['app', 'hud'], 'zendeskAddTags', async (args) =>
  addTags(args.tags)
);
router.addCommandHandler(['app', 'hud'], 'zendeskSetTags', async (args) =>
  setTags(args.tags)
);
router.addCommandHandler(['app', 'hud'], 'zendeskRemoveTags', async (args) =>
  removeTags(args.tags)
);

router.addCommandHandler(['app', 'hud'], 'zendeskSetTicketStatus', (args) =>
  setTicketStatus(args.ticketStatus)
);
router.addCommandHandler('app', 'zendeskGetMacros', getMacros);
router.addCommandHandler(['app', 'hud'], 'zendeskAssignMe', assignMe);

// Some helpful functions for debugging
if (process.env.APP_ENV === 'development') {
  // @ts-ignore
  window.handleLocalRequest = async (
    runtimeLocation: string,
    method: 'get' | 'set' | 'invoke',
    args: string[] | Record<string, any>
  ) => {
    const runtime = getRuntime(
      (r) => r.location === runtimeLocation && r.isActive
    )!;
    // @ts-ignore
    return handleLocalRequest(runtime, window.lastApp, method, args);
  };

  // @ts-ignore
  window.handleApiRequest = async (options: any) =>
    // @ts-ignore
    handleApiRequest(window.lastApp, options);
}
