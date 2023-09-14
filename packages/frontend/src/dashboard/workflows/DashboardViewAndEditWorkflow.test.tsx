import { RecoveryProvider } from '../../slate/Editor/Recovery';
import workflowFactory from '../../test/factories/workflow';
import { render, waitFor } from '../../testUtils';
import { DashboardViewAndEditWorkflow } from './DashboardViewAndEditWorkflow';

it('redirects auto-redirects the user to their branch when they have one', async () => {
  const userBranch = workflowFactory.withBranchId().build();
  const workflow = workflowFactory.withBranches([userBranch]).build();

  const { history } = render(
    <RecoveryProvider type="workflow" id={workflow.staticId}>
      <DashboardViewAndEditWorkflow workflow={workflow} fetchLoading={false} />
    </RecoveryProvider>,
    {
      initialPath: `/dashboard/playbooks/${workflow.staticId}/edit/`,
      apolloResolvers: {
        Query: {
          versionedNode: () => {
            return workflow;
          },
        },
        LatestNode: {
          __resolveType: () => {
            return workflow.__typename;
          },
        },
      },
    }
  );

  await waitFor(() =>
    expect(history.location.pathname).toEqual(
      `/dashboard/playbooks/${userBranch.staticId}/branch/${userBranch.branchId}`
    )
  );
});
