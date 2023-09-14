import mockMessageRouter, {
  mockMessageRouterCommandHandlers,
  mockMessageRouterSentCommands,
  SentCommand,
} from '../../__mocks__/@michaelschade/kenchi-message-router';

export const getCommandHandler = (key: [string, string]) =>
  mockMessageRouterCommandHandlers.get(JSON.stringify(key));
export const sendCommand = (destination: string, command: string, args?: any) =>
  mockMessageRouter.sendCommand(destination, command, args);
export const clearMockMessageRouter = () => {
  mockMessageRouterCommandHandlers.clear();
  mockMessageRouterSentCommands.length = 0;
};

export const expectSentCommand = (command: SentCommand) =>
  expect(mockMessageRouterSentCommands).toContainEqual(command);

export const expectAddedCommandHandler = (origin: string, command: string) =>
  expect(getCommandHandler([origin, command])).toBeDefined();
