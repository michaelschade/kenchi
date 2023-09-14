import collectionFactory from '../../test/factories/collection';
import userFactory from '../../test/factories/user';
import workflowFactory from '../../test/factories/workflow';
import { render } from '../../testUtils';
import PlaybooksPage from './PlaybooksPage';

const workflows = workflowFactory.buildList(21);
const collection = collectionFactory.withWorkflows(workflows).build();
const user = userFactory.withCollections([collection]).build();

it('displays the first page of results by default', async () => {
  const { findByText, queryByText } = render(<PlaybooksPage />, {
    apolloResolvers: {
      Viewer: {
        user: () => user,
      },
      Query: {
        versionedNode: (staticId) => {
          return workflows.find((workflow) => workflow.staticId === staticId);
        },
      },
    },
  });

  for (const workflow of workflows.slice(0, 20)) {
    const workflowElement = await findByText(workflow.name);
    expect(workflowElement).toBeInTheDocument();
  }

  const workflowElementFromSecondPage = queryByText(workflows[20].name);
  expect(workflowElementFromSecondPage).not.toBeInTheDocument();
});
