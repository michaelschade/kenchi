/*!
 * Contains Twemoji artwork by Twitter under CC-BY 4.0 license.
 * https://github.com/twitter/twemoji
 */

import { Suspense, useCallback, useEffect, useState } from 'react';

import { ThemeProvider } from '@emotion/react';
import { ErrorBoundary } from '@sentry/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Redirect,
  Route,
  Router,
  Switch,
  useHistory,
  useLocation,
} from 'react-router-dom';

import { ExtensionNodeConfig, WindowNodeConfig } from '@michaelschade/kenchi-message-router';
import { lightTheme } from '@kenchi/ui/lib/Colors';
import { ExtensionLayout } from '@kenchi/ui/lib/Layout';
import Loading from '@kenchi/ui/lib/Loading';
import { ToastProvider } from '@kenchi/ui/lib/Toast';
import useHotkey, {
  HotkeyProvider,
  useGlobalHotkey,
} from '@kenchi/ui/lib/useHotkey';

import Footer from './components/Footer';
import Header from './components/Header';
import { LoginAsNotice } from './components/LoginAsNotice';
import Dashboard from './dashboard';
import ApolloProvider from './graphql/ApolloProvider';
import { SettingsProvider } from './graphql/useSettings';
import useGoogleAPI from './login/useGoogleApi';
import { PageContextProvider } from './pageContext/PageContextProvider';
import {
  SidebarControllerProvider,
  useSidebarController,
} from './pageContext/sidebar/useSidebarController';
import { ServiceWorkerProvider } from './serviceWorker/ServiceWorkerProvider';
// Since this is almost always where we start don't chunk it
import ViewSpace from './space/ViewSpacePage';
import { forgivingSessionGet, isDevelopment, isExtension } from './utils';
import { trackEvent } from './utils/analytics';
import { initHistory } from './utils/history';
import lazy, { initLazy } from './utils/lazy';
import { QueryParamsProvider } from './utils/QueryParamsProvider';
import { MessageRouterProvider } from './utils/useMessageRouter';

const FatalErrorAlert = lazy(() => import('./components/FatalErrorAlert'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Scratchpad = lazy(() => import('./pages/Scratchpad'));
const DemoAdmin = lazy(() => import('./pages/Demo/Admin'));
const DemoVideoPage = lazy(() => import('./demo/DemoVideoPage'));

const InstalledPage = lazy(() => import('./installed/InstalledPage'));
const RecordStartPage = lazy(() => import('./record/RecordStartPage'));

const ViewCollection = lazy(() => import('./collection/ViewCollectionPage'));

const NewWorkflow = lazy(() => import('./workflow/pages/NewWorkflow'));
const MergeWorkflow = lazy(() => import('./workflow/pages/MergeWorkflow'));
const ViewWorkflow = lazy(() => import('./workflow/pages/ViewWorkflow'));
const EditWorkflow = lazy(() => import('./workflow/pages/EditWorkflow'));

const NewTool = lazy(() => import('./tool/pages/NewTool'));
const MergeTool = lazy(() => import('./tool/pages/MergeTool'));
const ViewTool = lazy(() => import('./tool/pages/ViewTool'));
const EditTool = lazy(() => import('./tool/pages/EditTool'));

const New = lazy(() => import('./pages/New'));
const Login = lazy(() => import('./login/LoginPage'));
const LoginAs = lazy(() => import('./login/LoginAsPage'));
const Privacy = lazy(() => import('./pages/Privacy'));

const UserSettings = lazy(() => import('./settings/UserSettingsPage'));
const ViewProductChange = lazy(() => import('./pages/ViewProductChange'));
const WhatsNew = lazy(() => import('./pages/WhatsNew'));

function ExtensionLayoutWithHotkeys({
  children,
  hasFooter,
}: {
  children: React.ReactNode;
  hasFooter: boolean;
}) {
  const history = useHistory();
  const sidebarController = useSidebarController();
  useGlobalHotkey(
    'h',
    useCallback(() => {
      window.setTimeout(() => {
        history.push('/');
      }, 0);
    }, [history])
  );
  useHotkey(
    'Escape',
    useCallback(() => {
      if (history.length > 1) {
        history.goBack();
      } else {
        sidebarController?.hideKenchi();
      }
    }, [history, sidebarController])
  );

  return (
    <ExtensionLayout emulateExtension={!isExtension()} hasFooter={hasFooter}>
      {children}
    </ExtensionLayout>
  );
}

// We can't use a React element here because we need the Route to be a direct
// child of the Switch
function extensionLayout(
  children: React.ReactElement<{ path: string }>[],
  { footer }: { footer: boolean }
) {
  const path = children.flatMap((child) => child.props.path);
  return (
    <Route path={path}>
      <ExtensionLayoutWithHotkeys hasFooter={footer}>
        <ErrorBoundary
          beforeCapture={(scope, _error, _component) => scope.setLevel('fatal')}
          fallback={(props) => <FatalErrorAlert {...props} />}
        >
          <Suspense fallback={<Loading name="extension layout suspense" />}>
            <Header />
            <Switch>{children}</Switch>
            {footer && <Footer />}
          </Suspense>
        </ErrorBoundary>
      </ExtensionLayoutWithHotkeys>
    </Route>
  );
}

const messageRouterConfig = {
  app: new WindowNodeConfig(window.location.origin, window),
  iframe: new WindowNodeConfig(
    `chrome-extension://${process.env.REACT_APP_EXTENSION_ID}`,
    window.parent
  ),
  background: new ExtensionNodeConfig(
    process.env.REACT_APP_EXTENSION_ID,
    'background'
  ),
  dashboard: new ExtensionNodeConfig(
    process.env.REACT_APP_EXTENSION_ID,
    'external'
  ),
};

const spacesRoute = ['/spaces/:id?', '/'];
function AppRouter() {
  const { pathname } = useLocation();
  useEffect(() => {
    const yScroll = forgivingSessionGet(`scrollY:${pathname}`);
    window.scrollTo(0, yScroll ? parseInt(yScroll) : 0);
  }, [pathname]);

  let keyIndex = 0;

  return (
    <Switch>
      <Route exact path="/demo/admin" component={DemoAdmin} />
      <Route exact path="/demo" component={DemoVideoPage} />
      <Route exact path="/empty" />
      {isDevelopment() && (
        <Route exact path="/scratchpad" component={Scratchpad} />
      )}
      <Route exact path="/installed" component={InstalledPage} />
      <Route exact path="/record" component={RecordStartPage} />
      <Route path="/dashboard">
        <Dashboard />
      </Route>

      {extensionLayout(
        [
          <Route key={keyIndex++} exact path="/login" component={Login} />,
          <Route
            key={keyIndex++}
            exact
            path="/login-as/:sessionId"
            component={LoginAs}
          />,
          <Route key={keyIndex++} exact path="/privacy" component={Privacy} />,
        ],
        { footer: false }
      )}

      {extensionLayout(
        [
          <Route
            key={keyIndex++}
            exact
            path="/collections/:id"
            component={ViewCollection}
          />,
          <Redirect
            key={keyIndex++}
            from="/workflows/new"
            to="/playbooks/new"
          />,
          <Route
            key={keyIndex++}
            exact
            path={'/playbooks/new'}
            component={NewWorkflow}
          />,
          <Redirect
            key={keyIndex++}
            from="/workflows/:id/merge/:branchId"
            to="/playbooks/:id/merge/:branchId"
          />,
          <Route
            key={keyIndex++}
            exact
            path={'/playbooks/:id/merge/:branchId'}
            component={MergeWorkflow}
          />,
          <Redirect
            key={keyIndex++}
            from="/workflows/:id/edit/:branchId?"
            to="/playbooks/:id/edit/:branchId?"
          />,
          <Route
            key={keyIndex++}
            exact
            path={'/playbooks/:id/edit/:branchId?'}
            component={EditWorkflow}
          />,
          <Redirect
            key={keyIndex++}
            from="/workflows/:id/:branchId?"
            to="/playbooks/:id/:branchId?"
          />,
          ...(isExtension()
            ? [
                <Route
                  key={keyIndex++}
                  exact
                  path={'/playbooks/:id/:branchId?'}
                  component={ViewWorkflow}
                />,
              ]
            : [
                <Redirect
                  key={keyIndex++}
                  from="/playbooks/:id/:branchId"
                  to="/dashboard/playbooks/:id/branch/:branchId"
                />,
                <Redirect
                  key={keyIndex++}
                  from="/playbooks/:id"
                  to="/dashboard/playbooks/:id"
                />,
              ]),
          <Redirect key={keyIndex++} from="/tools/new" to="/snippets/new" />,
          <Route
            key={keyIndex++}
            exact
            path={'/snippets/new'}
            component={NewTool}
          />,
          <Redirect
            key={keyIndex++}
            from="/tools/:id/merge/:branchId"
            to="/snippets/:id/merge/:branchId"
          />,
          <Route
            key={keyIndex++}
            exact
            path={'/snippets/:id/merge/:branchId'}
            component={MergeTool}
          />,
          <Redirect
            key={keyIndex++}
            from="/tools/:id/edit/:branchId?"
            to="/snippets/:id/edit/:branchId?"
          />,
          <Route
            key={keyIndex++}
            exact
            path={'/snippets/:id/edit/:branchId?'}
            component={EditTool}
          />,
          <Redirect
            key={keyIndex++}
            from="/tools/:id/:branchId?"
            to="/snippets/:id/:branchId?"
          />,
          ...(isExtension()
            ? [
                <Route
                  key={keyIndex++}
                  exact
                  path={'/snippets/:id/:branchId?'}
                  component={ViewTool}
                />,
              ]
            : [
                <Redirect
                  exact
                  key={keyIndex++}
                  from="/snippets/:id/:branchId"
                  to="/dashboard/snippets/:id/branch/:branchId"
                />,
                <Redirect
                  key={keyIndex++}
                  from="/snippets/:id"
                  to="/dashboard/snippets/:id"
                />,
              ]),
          <Route key={keyIndex++} exact path="/new" component={New} />,
          <Route
            key={keyIndex++}
            exact
            path="/settings"
            component={UserSettings}
          />,
          <Route
            key={keyIndex++}
            exact
            path="/whats-new/:id"
            component={ViewProductChange}
          />,
          <Route
            key={keyIndex++}
            exact
            path="/whats-new"
            component={WhatsNew}
          />,
          <Route
            key={keyIndex++}
            exact
            path={spacesRoute}
            component={ViewSpace}
          />,
          <Route key={keyIndex++} path="/" component={NotFound} />,
        ],
        { footer: true }
      )}
    </Switch>
  );
}

function App() {
  return (
    <ServiceWorkerProvider>
      <DndProvider backend={HTML5Backend}>
        <Suspense fallback={null}>
          <ThemeProvider theme={lightTheme}>
            <ToastProvider>
              <LoginAsNotice />
              <AppRouter />
            </ToastProvider>
          </ThemeProvider>
        </Suspense>
      </DndProvider>
    </ServiceWorkerProvider>
  );
}

const trackHotkeyEvent = (key: string) =>
  trackEvent({ category: 'shortcuts', action: key });

function AppProviderStack() {
  useGoogleAPI();

  // We need to keep this in useState otherwise hot reloading gets sad
  const [history] = useState(() => initHistory(isExtension()));
  initLazy(history);

  // If you add anything here that's ~required to run Kenchi don't forget to also add it to src/hud/App.tsx
  return (
    <MessageRouterProvider
      name={isExtension() ? 'app' : 'dashboard'}
      config={messageRouterConfig}
    >
      <ApolloProvider>
        <Router history={history}>
          <QueryParamsProvider>
            <SettingsProvider>
              <PageContextProvider>
                <HotkeyProvider trackEvent={trackHotkeyEvent}>
                  {isExtension() ? (
                    <SidebarControllerProvider>
                      <App />
                    </SidebarControllerProvider>
                  ) : (
                    <App />
                  )}
                </HotkeyProvider>
              </PageContextProvider>
            </SettingsProvider>
          </QueryParamsProvider>
        </Router>
      </ApolloProvider>
    </MessageRouterProvider>
  );
}

export default AppProviderStack;
