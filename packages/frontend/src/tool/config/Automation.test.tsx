import { Commands } from '@kenchi/commands';

import mockMessageRouter from '../../__mocks__/@michaelschade/kenchi-message-router';
import toolFactory from '../../test/factories/tool';
import { expectSentCommand } from '../../test/helpers/messageRouter';
import {
  buildPageDataController,
  mockFormatter,
} from '../../test/helpers/pageDataController';
import { waitFor } from '../../testUtils';
import automation from './Automation';

const tool = toolFactory.build({
  configuration: {
    steps: [
      {
        command: 'insertText',
        id: 'step_12345',
        label: 'Reply',
        overwrite: true,
        text: {
          children: [{ text: 'Hello World!' }],
          rich: true,
          singleLine: false,
          slate: true,
        },
        xpath: '//div[@id="12345"]',
      },
    ],
  },
});

it('inserts text on the page', async () => {
  const pageDataController = buildPageDataController({
    formatter: mockFormatter({
      formatRich: () => ({ html: 'Hello World!', text: 'Hello World!' }),
    }),
  });
  mockMessageRouter.addCommandHandler(
    'pageScript',
    'automation:waitFor',
    ({ id }: Commands['pageScript']['automation:waitFor']['args']) => {
      mockMessageRouter.sendCommand(
        'pageScript',
        'automation:waitForResponse',
        {
          id,
          success: true,
        }
      );
      return Promise.resolve({ success: true });
    }
  );

  automation.execute(
    mockMessageRouter,
    pageDataController,
    null,
    {},
    tool.configuration
  );

  const step = tool.configuration.steps[0];
  await waitFor(() =>
    expectSentCommand({
      destination: 'contentScript',
      command: 'insertText',
      args: {
        data: { text: 'Hello World!', html: 'Hello World!' },
        path: { type: 'xpath', xpath: step.xpath },
        useSelection: !step.overwrite,
      },
    })
  );
});
