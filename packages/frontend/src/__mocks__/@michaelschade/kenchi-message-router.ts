import { CommandHandler, MessageBlob } from '@michaelschade/kenchi-message-router';
import { CommandOpts } from '@michaelschade/kenchi-message-router/dist/types';

export type SentCommand = {
  destination: string;
  command: string;
  args?: any;
  opts?: any;
};
export const mockMessageRouterCommandHandlers: Map<
  string,
  CommandHandler<any, any>
> = new Map<string, CommandHandler<any, any>>();
export const mockMessageRouterSentCommands: SentCommand[] = [];

const mockMessageRouter = {
  addCommandHandler: <
    TArgs extends {} = {},
    TResp extends void | MessageBlob = void
  >(
    origins: string | string[],
    command: string,
    handler: CommandHandler<TArgs, TResp>
  ): void => {
    mockMessageRouterCommandHandlers.set(
      JSON.stringify([origins, command]),
      handler
    );
  },
  sendCommand: async <
    TArgs extends {} = {},
    TResp extends void | MessageBlob = void
  >(
    destination: string,
    command: string,
    args?: TArgs,
    opts?: CommandOpts
  ): Promise<TResp> => {
    mockMessageRouterSentCommands.push({ destination, command, args, opts });
    const handler = mockMessageRouterCommandHandlers.get(
      JSON.stringify([destination, command])
    );
    return handler && handler(args, command, destination);
  },
  removeCommandHandler: jest.fn(),
  registerListeners: jest.fn(),
  unregisterListeners: jest.fn(),
};

export * from '@michaelschade/kenchi-message-router';
export default mockMessageRouter;
