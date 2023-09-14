import userEvent from '@testing-library/user-event';

import workflowFactory from '../../test/factories/workflow';
import { render } from '../../testUtils';
import WorkflowLink from './WorkflowLink';

it('links to the playbook page', async () => {
  const workflow = workflowFactory.build();
  const staticId = workflow.staticId;

  const { history, findByText } = render(
    <WorkflowLink
      element={{
        type: 'workflow-link',
        workflow: staticId,
        children: [],
      }}
    />,
    {
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

  const workflowLink = await findByText(workflow.name, {});
  userEvent.click(workflowLink);
  expect(history.location.pathname).toEqual(`/playbooks/${staticId}`);
});
