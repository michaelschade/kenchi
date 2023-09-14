import {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from 'react';

import { getTopology, KenchiMessageRouter } from '@kenchi/commands';
import MessageRouter, {
  ICommands,
  IMessageRouter,
} from '@michaelschade/kenchi-message-router';
import { NodeConfigs } from '@michaelschade/kenchi-message-router/dist/Config';

import { isExtension, isMessageRouterErrorType } from '.';

class LoggingMessageRouter<TCommands extends ICommands, TNode extends string>
  implements IMessageRouter<TCommands, TNode>
{
  sendCommand(
    destination: string,
    command: string,
    ...rest: any[]
  ): Promise<any> {
    console.log(`[app => ${destination}] ${command}`, rest[0]);
    // TODO: reject instead...need to make sure everything in App catches
    return Promise.resolve({ success: false }) as any;
  }

  addCommandHandler() {}
  removeCommandHandler() {}
  registerListeners() {}
  unregisterListeners() {}
}

type ProvidedNodes = 'app' | 'hud' | 'dashboard';
type ProvidedMessageRouter = KenchiMessageRouter<ProvidedNodes>;

const InternalProvider = createContext<ProvidedMessageRouter>(
  new LoggingMessageRouter()
);

const lighterLogger = (level: 'log' | 'debug', msg: string, details?: {}) => {
  if (level === 'debug') {
    return;
  }
  if (details) {
    console.debug(msg, details);
  } else {
    console.debug(msg);
  }
};

export function MessageRouterProvider<TNode extends ProvidedNodes>({
  name,
  config,
  router,
  children,
}: {
  name: TNode;
  config: NodeConfigs;
  router?: KenchiMessageRouter<TNode>;
  children: ReactElement;
}): ReactElement {
  const [storedRouter] = useState<ProvidedMessageRouter>(() => {
    if (router) {
      return router as ProvidedMessageRouter;
    } else {
      return new MessageRouter(
        config,
        getTopology(
          process.env.REACT_APP_HOST,
          process.env.REACT_APP_EXTENSION_ID
        ),
        name,
        lighterLogger
      ) as ProvidedMessageRouter;
    }
  });

  useEffect(() => {
    if (!isExtension()) {
      return;
    }
    storedRouter.registerListeners();
    return () => storedRouter.unregisterListeners();
  }, [storedRouter, name]);
  if (!storedRouter) {
    return children;
  } else {
    return (
      <InternalProvider.Provider value={storedRouter}>
        {children}
      </InternalProvider.Provider>
    );
  }
}

export function useMessageRouterReady<TNode extends 'app' | 'hud'>(
  destination: TNode extends 'app' ? 'iframe' : 'contentScript'
) {
  // This should be <TNode> but TS has issues with the typing of that, since
  // it'll map origin as 'app' | 'hud' and destination as 'iframe' |
  // 'contentScript', and not all of the combinations there support
  // 'system:ready'. To get around this just pretend type-wise that we're only
  // 'app' => 'iframe'
  const router = useMessageRouter<'app'>();
  useEffect(() => {
    const systemReady = async () => {
      try {
        // See above comment on why we `as 'iframe'` here.
        await router.sendCommand(destination as 'iframe', 'system:ready');
      } catch (e) {
        if (isMessageRouterErrorType(e, 'alreadyReady')) {
          console.log(
            'System already initialized, we probably refreshed the app'
          );
        } else {
          throw e;
        }
      }
    };
    systemReady();
  }, [router, destination]);
}

export default function useMessageRouter<TNode extends ProvidedNodes>() {
  return useContext(InternalProvider) as KenchiMessageRouter<TNode>;
}
