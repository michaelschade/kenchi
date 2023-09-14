import { SlateNode } from '@kenchi/slate-tools/lib/types';

import toolFactory from '../test/factories/tool';
import { MockApolloProvider, renderRaw } from '../testUtils';
import { SlateComponentsForStaticRender } from './SlateComponentsForStaticRender';

const tool = toolFactory.build();

const PLAYBOOK_CONTENT_WITH_EMBEDDED_SNIPPET: SlateNode[] = [
  {
    type: 'tool',
    tool: tool.staticId,
    children: [
      {
        text: '',
      },
    ],
  },
];

test('SlateComponentsForStaticRender renders tool node without error', async () => {
  const mocks = {
    LatestNode: () => tool,
  };
  const { findByText } = renderRaw(
    <MockApolloProvider mocks={mocks}>
      <SlateComponentsForStaticRender
        slateNodes={PLAYBOOK_CONTENT_WITH_EMBEDDED_SNIPPET}
        slateRenderOpts={{}}
      />
    </MockApolloProvider>
  );
  const elem = await findByText(tool.name);
  expect(elem).toBeInTheDocument();
});
