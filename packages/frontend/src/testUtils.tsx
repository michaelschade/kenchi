import { useState } from 'react';

import { ApolloClient, ApolloProvider } from '@apollo/client';
import { SchemaLink } from '@apollo/client/link/schema';
import { ThemeProvider } from '@emotion/react';
import { addMocksToSchema, IMocks } from '@graphql-tools/mock';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { IResolvers } from '@graphql-tools/utils';
import { render as renderRaw, RenderOptions } from '@testing-library/react';
import fs from 'fs';
import { createMemoryHistory, MemoryHistoryBuildOptions } from 'history';
import path from 'path';
import { Router } from 'react-router-dom';
import waitTimeDoNotUse from 'waait';

import { lightTheme } from '@kenchi/ui/lib/Colors';
import { ToastProvider } from '@kenchi/ui/lib/Toast';
import { HotkeyProvider } from '@kenchi/ui/lib/useHotkey';

import mockMessageRouter from './__mocks__/@michaelschade/kenchi-message-router';
import { getCache } from './graphql/cache';
import { SettingsProvider } from './graphql/useSettings';
import DomainSettingsController from './pageContext/domainSettings/DomainSettingsController';
import { InternalProvider as PageContext } from './pageContext/PageContextProvider';
import { PageData } from './pageContext/pageData/PageDataController';
import PageUrlObserver from './pageContext/pageUrl/PageUrlObserver';
import { buildPageDataController } from './test/helpers/pageDataController';
import { QueryParamsProvider } from './utils/QueryParamsProvider';
import { MessageRouterProvider } from './utils/useMessageRouter';

export const mockApolloClient = ({
  mocks,
  resolvers,
}: {
  mocks?: IMocks;
  resolvers?: IResolvers;
}) => {
  const baseSchema = makeExecutableSchema({
    typeDefs: fs.readFileSync(
      path.join(__dirname, '../../backend/api.graphql'),
      'utf8'
    ),
  });

  const mockedSchema = addMocksToSchema({
    schema: baseSchema,
    mocks: {
      // Stub out all the scalars
      Json: () => ({}),
      InsertionPath: () => ({}),
      ToolInput: () => ({}),
      ToolConfiguration: () => ({}),
      DateTime: () => '2021-01-01T00:00:00.000Z',
      ...mocks,
    },
    resolvers,
    preserveResolvers: false,
  });
  return new ApolloClient({
    link: new SchemaLink({ schema: mockedSchema }),
    cache: getCache(),
  });
};

export const MockApolloProvider = ({
  children,
  ...apolloMocks
}: {
  mocks?: IMocks;
  resolvers?: IResolvers;
  children: React.ReactChild;
}) => {
  const [client] = useState(() => {
    return mockApolloClient(apolloMocks);
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

type CustomRenderOptions = RenderOptions & {
  apolloMocks?: IMocks;
  apolloResolvers?: IResolvers;
  initialPath?: string;
  pageVariables?: Record<string, string>;
  providerStack?: 'app' | 'hud';
};
const render = (ui: React.ReactElement, options?: CustomRenderOptions) => {
  const historyOptions: MemoryHistoryBuildOptions = {};
  if (options?.initialPath) {
    historyOptions.initialEntries = [options.initialPath];
  }
  const history = createMemoryHistory(historyOptions);

  // @ts-ignore
  const domainSettingsController: DomainSettingsController = {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    update: jest.fn(),
  };

  const pageDataController: PageData = buildPageDataController({
    pageVariables: options?.pageVariables,
  });

  // @ts-ignore
  const pageUrlObserver: PageUrlObserver = {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    _currentUrl: jest.fn(),
  };

  const providerStack = options?.providerStack ?? 'app';

  let wrapper: React.FunctionComponent;

  if (providerStack === 'app') {
    // Ensure this stays in sync with src/App.tsx#AppProviderStack
    wrapper = ({ children }: { children?: React.ReactNode }) => {
      // TODO: we prob want the cache to refresh on every render?
      return (
        <MessageRouterProvider
          name={providerStack}
          config={{}}
          router={mockMessageRouter}
        >
          <MockApolloProvider
            mocks={options?.apolloMocks}
            resolvers={options?.apolloResolvers}
          >
            <Router history={history}>
              <QueryParamsProvider>
                <SettingsProvider>
                  <PageContext.Provider
                    value={{
                      domainSettingsController,
                      pageDataController,
                      pageUrlObserver,
                    }}
                  >
                    <HotkeyProvider>
                      <ThemeProvider theme={lightTheme}>
                        <ToastProvider>{children}</ToastProvider>
                      </ThemeProvider>
                    </HotkeyProvider>
                  </PageContext.Provider>
                </SettingsProvider>
              </QueryParamsProvider>
            </Router>
          </MockApolloProvider>
        </MessageRouterProvider>
      );
    };
  } else {
    // Ensure this stays in sync with src/hud/App.tsx
    wrapper = ({ children }: { children?: React.ReactNode }) => {
      // TODO: we prob want the cache to refresh on every render?
      return (
        <MessageRouterProvider
          name={providerStack}
          config={{}}
          router={mockMessageRouter}
        >
          <MockApolloProvider
            mocks={options?.apolloMocks}
            resolvers={options?.apolloResolvers}
          >
            <SettingsProvider>
              <PageContext.Provider
                value={{
                  domainSettingsController,
                  pageDataController,
                  pageUrlObserver,
                }}
              >
                <HotkeyProvider>
                  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
                </HotkeyProvider>
              </PageContext.Provider>
            </SettingsProvider>
          </MockApolloProvider>
        </MessageRouterProvider>
      );
    };
  }

  const resp = renderRaw(ui, { wrapper, ...options });
  return {
    history,
    ...resp,
  };
};

// re-export everything
export * from '@testing-library/react';
// override render method
export { render, renderRaw, waitTimeDoNotUse };
