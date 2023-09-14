import { ThemeProvider } from '@emotion/react';
import { parse } from 'qs';

import { ExtensionNodeConfig, WindowNodeConfig } from '@michaelschade/kenchi-message-router';
import { lightTheme } from '@kenchi/ui/lib/Colors';
import { ContentContainer, ExtensionLayout } from '@kenchi/ui/lib/Layout';
import { HotkeyProvider } from '@kenchi/ui/lib/useHotkey';

import DefaultApolloProvider from '../graphql/ApolloProvider';
import { SettingsProvider } from '../graphql/useSettings';
import { PageContextProvider } from '../pageContext/PageContextProvider';
import { trackEvent } from '../utils/analytics';
import { MessageRouterProvider } from '../utils/useMessageRouter';
import Hud from './Hud';

const tabId = parseInt(
  (parse(window.location.search.substr(1)).tab || '') as string
);
const messageRouterConfig = {
  hud: [
    new WindowNodeConfig(window.location.origin, window),
    new ExtensionNodeConfig(
      process.env.REACT_APP_EXTENSION_ID,
      'external',
      tabId
    ),
  ],
  background: new ExtensionNodeConfig(
    process.env.REACT_APP_EXTENSION_ID,
    'background'
  ),
  contentScript: new WindowNodeConfig('*', window.parent),
};

const trackHotkeyEvent = (key: string) =>
  trackEvent({ category: 'shortcuts', action: key });

export default function App({
  ApolloProvider = DefaultApolloProvider,
}: {
  ApolloProvider?: React.FC<{}>;
}) {
  return (
    <MessageRouterProvider name="hud" config={messageRouterConfig}>
      <ApolloProvider>
        <SettingsProvider>
          <PageContextProvider>
            <HotkeyProvider trackEvent={trackHotkeyEvent}>
              <ThemeProvider theme={lightTheme}>
                <ExtensionLayout emulateExtension={false} hasFooter={false}>
                  <ContentContainer>
                    <Hud />
                  </ContentContainer>
                </ExtensionLayout>
              </ThemeProvider>
            </HotkeyProvider>
          </PageContextProvider>
        </SettingsProvider>
      </ApolloProvider>
    </MessageRouterProvider>
  );
}
