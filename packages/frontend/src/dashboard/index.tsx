import { Suspense } from 'react';

import { ErrorBoundary } from '@sentry/react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { DashboardLayout } from '@kenchi/ui/lib/Dashboard';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import FatalErrorAlert from '../components/FatalErrorAlert';
// TODO: dashboard-specific header
import Header from '../components/Header';
import { ReactComponent as Logo } from '../logos/wordmark.svg';
import lazy from '../utils/lazy';
import Sidebar from './Sidebar';

const CollectionPage = lazy(() => import('./collections/CollectionPage'));
const CollectionsPage = lazy(() => import('./collections/CollectionsPage'));
const GroupsPage = lazy(() => import('./groups/GroupsPage'));
const ImportPage = lazy(() => import('./import/ImportPage'));
const LoginPage = lazy(() => import('./LoginPage'));
const PendingImportPage = lazy(() => import('./import/PendingImportPage'));
const EditSpacePage = lazy(() => import('./spaces/DashboardEditSpacePage'));
const NewSpacePage = lazy(() => import('./spaces/DashboardNewSpacePage'));
const SpacesPage = lazy(() => import('./spaces/SpacesPage'));
const SuggestionPage = lazy(() => import('./suggestions/SuggestionPage'));
const SuggestionsPage = lazy(() => import('./suggestions/SuggestionsPage'));
const PlaybooksPage = lazy(() => import('./playbooks/PlaybooksPage'));
const WidgetsPage = lazy(() => import('./widgets/WidgetsPage'));
const SnippetsPage = lazy(() => import('./snippets/SnippetsPage'));
const UsersPage = lazy(() => import('./users/UsersPage'));
const ExportWorkflowsPage = lazy(() => import('./ExportWorkflows'));
const ExportSnippetsPage = lazy(() => import('./ExportSnippets'));
const OrganizationPage = lazy(() => import('./OrganizationPage'));
const NewToolPage = lazy(() => import('../tool/pages/DashboardNewToolPage'));
const ViewAndEditToolPage = lazy(
  () => import('../tool/pages/DashboardViewAndEditTool')
);
const NewWorkflowPage = lazy(
  () => import('./workflows/DashboardNewWorkflowPage')
);
const ViewAndEditWorkflowPage = lazy(
  () => import('./workflows/DashboardViewAndEditWorkflow')
);
const NotFoundPage = lazy(() => import('../pages/NotFound'));
const QuickstartPage = lazy(() => import('./quickstart/QuickstartPage'));
const NewDataSourcePage = lazy(() => import('./dataSources/NewDataSource'));
const RecordDataSourcePage = lazy(() => import('./dataSources/Record'));

export default function Dashboard() {
  return (
    <DashboardLayout logo={Logo} sidebar={<Sidebar />}>
      <ErrorBoundary
        beforeCapture={(scope, _error, _component) => scope.setLevel('fatal')}
        fallback={(props) => <FatalErrorAlert {...props} />}
      >
        <Suspense
          fallback={<LoadingSpinner name="dashboard routes suspense" />}
        >
          <Header />
          <Switch>
            <Route
              exact
              path="/dashboard/suggestions/:id"
              component={SuggestionPage}
            />
            <Route
              exact
              path="/dashboard/suggestions"
              component={SuggestionsPage}
            />
            <Route
              exact
              path="/dashboard/import/pending"
              component={PendingImportPage}
            />
            <Route exact path="/dashboard/import/:id" component={ImportPage} />
            <Route
              exact
              path="/dashboard/import/:id/preview/:entryId"
              component={ImportPage}
            />
            <Route
              exact
              path="/dashboard/export/snippets"
              component={ExportSnippetsPage}
            />
            <Route
              exact
              path={[
                '/dashboard/export/workflows',
                '/dashboard/export/playbooks',
              ]}
              component={ExportWorkflowsPage}
            />
            <Route
              exact
              path="/dashboard/playbooks"
              component={PlaybooksPage}
            />
            <Route exact path="/dashboard/snippets" component={SnippetsPage} />
            <Route exact path="/dashboard/widgets" component={WidgetsPage} />
            <Route
              exact
              path={['/dashboard/collections', '/dashboard/collections/new']}
              component={CollectionsPage}
            />
            <Route
              exact
              path="/dashboard/collections/:id"
              component={CollectionPage}
            />
            <Route
              exact
              path={['/dashboard/tools/new', '/dashboard/snippets/new']}
              component={NewToolPage}
            />
            <Route
              exact
              path={[
                '/dashboard/tools/:id',
                '/dashboard/tools/:id/branch/:branchId',
                '/dashboard/snippets/:id',
                '/dashboard/snippets/:id/branch/:branchId',
              ]}
              component={ViewAndEditToolPage}
            />
            <Route
              exact
              path={['/dashboard/workflows/new', '/dashboard/playbooks/new']}
              component={NewWorkflowPage}
            />
            <Route
              exact
              path={[
                '/dashboard/workflows/:id',
                '/dashboard/workflows/:id/branch/:branchId',
                '/dashboard/playbooks/:id',
                '/dashboard/playbooks/:id/branch/:branchId',
              ]}
              component={ViewAndEditWorkflowPage}
            />
            <Route
              exact
              path="/dashboard/collections/:id/edit"
              component={CollectionPage}
            />
            <Route
              exact
              path="/dashboard/groups/:groupId?"
              component={GroupsPage}
            />
            <Route
              exact
              path="/dashboard/spaces/new"
              component={NewSpacePage}
            />
            <Route
              exact
              path="/dashboard/spaces/:id"
              component={EditSpacePage}
            />
            <Route exact path="/dashboard/spaces" component={SpacesPage} />
            <Route exact path="/dashboard/users/:id?" component={UsersPage} />
            <Route
              exact
              path={[
                '/dashboard/organization',
                '/dashboard/organization/intercom',
              ]}
              component={OrganizationPage}
            />
            <Route
              exact
              path="/dashboard/data-sources/new"
              component={NewDataSourcePage}
            />
            <Route
              exact
              path="/dashboard/data-sources/record"
              component={RecordDataSourcePage}
            />
            <Route exact path="/dashboard/login" component={LoginPage} />
            <Route
              exact
              path="/dashboard/quickstart/:step?"
              component={QuickstartPage}
            />
            <Redirect exact from="/dashboard" to="/dashboard/quickstart" />
            <Route path="/dashboard" component={NotFoundPage} />
          </Switch>
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
