import { ApolloProvider, useApolloClient } from '@apollo/client';
import { ThemeProvider } from '@emotion/react';
import { MemoryRouter } from 'react-router-dom';

import { SlateNode } from '@kenchi/slate-tools/lib/types';
import { lightTheme } from '@kenchi/ui/lib/Colors';
import { HotkeyProvider } from '@kenchi/ui/lib/useHotkey';

import { SettingsProvider } from '../graphql/useSettings';
import { PageContextProvider } from '../pageContext/PageContextProvider';
import { getRenderedComponents, RenderOpts } from './Renderer';

type SlateComponentsForStaticRenderProps = {
  slateNodes: SlateNode[];
  slateRenderOpts: RenderOpts;
};

export const SlateComponentsForStaticRender = ({
  slateNodes,
  slateRenderOpts,
}: SlateComponentsForStaticRenderProps) => {
  const client = useApolloClient();
  return (
    <ApolloProvider client={client}>
      <SettingsProvider fetchPolicy="cache-first">
        <PageContextProvider>
          <HotkeyProvider>
            <ThemeProvider theme={lightTheme}>
              {/* Hack to  make <Link> elements work...you need a router */}
              <MemoryRouter>
                {getRenderedComponents(slateNodes, slateRenderOpts)}
              </MemoryRouter>
            </ThemeProvider>
          </HotkeyProvider>
        </PageContextProvider>
      </SettingsProvider>
    </ApolloProvider>
  );
};
