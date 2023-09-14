import mockMessageRouter from '../../__mocks__/@michaelschade/kenchi-message-router';
import {
  defaultActions,
  intercomActions,
  zendeskActions,
} from '../../pageContext/actions/actionRunners';
import { PageActionMap } from '../../pageContext/actions/types';
import FormatterInterface from '../../pageContext/pageData/formatters/FormatterInterface';
import { PageData } from '../../pageContext/pageData/PageDataController';

export const mockFormatter = (
  formatOverrides: Partial<FormatterInterface>
): FormatterInterface => ({
  ...{
    formatRich: jest.fn(),
    formatText: jest.fn(),
  },
  ...formatOverrides,
});

const defaultMockFormatter = mockFormatter({
  formatRich: jest.fn(() => ({
    text: 'Hello World!',
    html: '<p>Hello World!</p>',
  })),
  formatText: jest.fn(() => 'Hello World!'),
});

const actionRunnerMap: PageActionMap = {
  ...defaultActions,
  ...intercomActions,
  ...zendeskActions,
};
export const buildPageDataController = ({
  formatter,
  pageVariables,
  overrides,
}: {
  formatter?: FormatterInterface;
  pageVariables?: Record<string, string> | undefined;
  overrides?: Partial<PageData>;
} = {}): PageData => {
  const pageDataController: PageData = {
    addListener: jest.fn(
      (listener) => pageVariables && listener(pageVariables)
    ),
    removeListener: jest.fn(),
    getFormatter: () => formatter ?? defaultMockFormatter,
    prepareForTextInsertion: () => Promise.resolve(undefined),
    getExtractor: (_name) => null,
    supportedActions: () => [],
    runAction: (type, ...args) =>
      // In tests just use the not-so-safe ! operator
      actionRunnerMap[type]!(
        {
          messageRouter: mockMessageRouter,
          pageDataController,
          domainSettings: null,
        },
        (args[0] ?? {}) as any
      ),
    ...overrides,
  };
  return pageDataController;
};
