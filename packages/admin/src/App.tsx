import 'bootstrap/dist/css/bootstrap-reboot.css';

import { ApolloProvider } from '@apollo/client';
// Needed until we actually import @emotion somewhere else so we get the TS
// definitions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { css, ThemeProvider } from '@emotion/react';
import { faExternalLink } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BrowserRouter, Route } from 'react-router-dom';

import { lightTheme } from '@kenchi/ui/lib/Colors';
import { DashboardLayout } from '@kenchi/ui/lib/Dashboard';
import {
  MenuContainer,
  MenuItemLink,
  MenuItemList,
  MenuSection,
} from '@kenchi/ui/lib/Menu';

import QuickLinks from './components/QuickLinks';
import { getClient } from './graphql/client';
import { ReactComponent as Logo } from './logos/wordmark.svg';
import BigButtons from './pages/BigButtons';
import DB from './pages/DB';
import DomainSettings from './pages/DomainSettings';
import ProductChanges from './pages/ProductChanges';
import ViewObject from './pages/ViewObject';
import ViewOrganizations from './pages/ViewOrganizations';
import ViewPageSnapshot from './pages/ViewPageSnapshot';
import ViewToolRunLog from './pages/ViewToolRunLog';

function Sidebar() {
  return (
    <MenuContainer>
      <MenuItemList>
        <MenuItemLink to="/" active={{ exact: true }}>
          Home
        </MenuItemLink>
        <MenuItemLink to="/product-changes">Product Changes</MenuItemLink>
        <MenuItemLink to="/organizations">Organizations</MenuItemLink>
        <MenuItemLink to="/domains">Global Domain Flags</MenuItemLink>
      </MenuItemList>
      <MenuSection title="Infra">
        <MenuItemList>
          <MenuItemLink to="/db">DB Migrations</MenuItemLink>
          <MenuItemLink to="/big-buttons">Big Buttons</MenuItemLink>
          <MenuItemLink
            to={`${process.env.REACT_APP_API_HOST}/admin/queues`}
            target="_blank"
          >
            Queues{' '}
            <FontAwesomeIcon
              style={{ fontSize: '0.8em' }}
              icon={faExternalLink}
            />
          </MenuItemLink>
        </MenuItemList>
      </MenuSection>
      <QuickLinks />
    </MenuContainer>
  );
}

function App() {
  return (
    <ApolloProvider client={getClient()}>
      <ThemeProvider theme={lightTheme}>
        <BrowserRouter>
          <DashboardLayout logo={Logo} sidebar={<Sidebar />}>
            <Route exact path="/db" component={DB} />
            <Route exact path="/product-changes" component={ProductChanges} />
            <Route exact path="/domains" component={DomainSettings} />
            <Route exact path="/tool-run-logs/:id" component={ViewToolRunLog} />
            <Route
              exact
              path="/page-snapshots/:id"
              component={ViewPageSnapshot}
            />
            <Route exact path="/big-buttons" component={BigButtons} />
            <Route
              exact
              path="/organizations/:orgId?"
              component={ViewOrganizations}
            />
            <Route
              exact
              path="/organizations/:orgId/domains"
              component={DomainSettings}
            />
            <Route
              exact
              path="/users/:userId/domains"
              component={DomainSettings}
            />
            <Route exact path={['/', '/object/:id?']} component={ViewObject} />
          </DashboardLayout>
        </BrowserRouter>
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default App;
