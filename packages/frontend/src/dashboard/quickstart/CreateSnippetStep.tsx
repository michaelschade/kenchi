import { useCallback, useEffect } from 'react';

import { css } from '@emotion/react';
import { useHistory, useParams } from 'react-router-dom';

import { PrimaryButton } from '@kenchi/ui/lib/Button';
import { SlideInDialog } from '@kenchi/ui/lib/SlideInDialog';

import { ToolFragment } from '../../graphql/generated';
import DashboardNewTool from '../../tool/pages/DashboardNewTool';
import { trackEvent } from '../../utils/analytics';
import { NextStepLink } from './NextStepLink';
import { useQuickstartStatus } from './useQuickstartStatus';

const slideInPageStyle = css`
  padding: 1rem 2rem;
`;

type PropsForCreateSnippetStep = {
  onDone: () => void;
  onClickCelebrate: () => void;
};

export const CreateSnippetStep = ({
  onDone,
  onClickCelebrate,
}: PropsForCreateSnippetStep) => {
  const history = useHistory();
  const { step } = useParams<{ step?: string }>();
  const { hasTool } = useQuickstartStatus();
  const backToGS = useCallback(
    () => history.push('/dashboard/quickstart?tab=createSnippet'),
    [history]
  );

  useEffect(() => {
    trackEvent({
      category: 'quickstart',
      action: 'open_create_tool',
    });
  }, []);

  const wrappedOnDone = useCallback(
    (tool: ToolFragment) => {
      onDone();
      backToGS();
      trackEvent({
        category: 'quickstart',
        action: 'complete_create_tool',
        object: tool.staticId,
      });
    },
    [backToGS, onDone]
  );

  return (
    <div
      css={css`
        display: grid;
        gap: 1rem;

        p {
          margin: 0;
        }
      `}
    >
      <p>
        Snippets let you save commonly used text&mdash;from short phrases to
        entire replies&mdash;and retype them with just a few keystrokes.
        Personalized with your customer's information, shared with your entire
        team, and accessible via quick shortcuts, snippets give your team higher
        quality answers in less time.
      </p>
      <div>
        <PrimaryButton
          onClick={() => {
            history.push('/dashboard/quickstart/snippet?tab=createSnippet');
          }}
        >
          {hasTool ? 'Create another snippet' : 'Create a snippet'}
        </PrimaryButton>
      </div>
      {hasTool && <NextStepLink onClickCelebrate={onClickCelebrate} />}
      <SlideInDialog
        isOpen={step === 'snippet'}
        width="large"
        onClose={backToGS}
      >
        <div css={slideInPageStyle}>
          <DashboardNewTool onCancel={backToGS} onDone={wrappedOnDone} />
        </div>
      </SlideInDialog>
    </div>
  );
};
