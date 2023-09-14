import styled from '@emotion/styled';

import { WorkflowEmbedElement } from '@kenchi/slate-tools/lib/types';

import useWorkflow from '../../workflow/useWorkflow';
import Renderer from '../Renderer';

const Wrapper = styled.div`
  position: relative;
`;

type WorkflowEmbedProps = {
  element: WorkflowEmbedElement;
};

export default function WorkflowEmbed({
  element: { workflow: staticId },
}: WorkflowEmbedProps) {
  const { workflow } = useWorkflow(staticId);
  let contents = null;
  if (workflow) {
    if (!workflow.contents) {
      throw new Error('Missing playbook contents');
    }
    contents = <Renderer contents={workflow.contents} />;
  } else {
    contents = 'You may not have permission to view this embedded playbook.';
  }

  return <Wrapper>{contents}</Wrapper>;
}
