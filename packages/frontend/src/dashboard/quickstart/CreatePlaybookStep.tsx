import { useCallback, useEffect } from 'react';

import { css } from '@emotion/react';
import { useHistory, useParams } from 'react-router-dom';

import { PrimaryButton } from '@kenchi/ui/lib/Button';
import { SlideInDialog } from '@kenchi/ui/lib/SlideInDialog';

import { WorkflowFragment } from '../../graphql/generated';
import { trackEvent } from '../../utils/analytics';
import DashboardNewWorkflow from '../workflows/DashboardNewWorkflow';
import { NextStepLink } from './NextStepLink';
import { useQuickstartStatus } from './useQuickstartStatus';

const slideInPageStyle = css`
  padding: 1rem 2rem;
`;

type PropsForCreatePlaybookStep = {
  onDone: () => void;
  onClickCelebrate: () => void;
};

export const CreatePlaybookStep = ({
  onDone,
  onClickCelebrate,
}: PropsForCreatePlaybookStep) => {
  const history = useHistory();
  const { step } = useParams<{ step?: string }>();
  const { hasWorkflow } = useQuickstartStatus();
  const backToGS = useCallback(
    () => history.push('/dashboard/quickstart?tab=createPlaybook'),
    [history]
  );

  useEffect(() => {
    trackEvent({
      category: 'quickstart',
      action: 'open_create_workflow',
    });
  }, []);

  const wrappedOnDone = useCallback(
    (workflow: WorkflowFragment) => {
      onDone();
      backToGS();
      trackEvent({
        category: 'quickstart',
        action: 'complete_create_workflow',
        object: workflow.staticId,
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
        Playbooks give your whole team access to an up-to-date knowledge base,
        available from any support platform or website you use. Everything from
        troubleshooting tips to step-by-step guides for launching new features.
      </p>
      <div>
        <PrimaryButton
          onClick={() =>
            history.push('/dashboard/quickstart/playbook?tab=createPlaybook')
          }
        >
          {hasWorkflow ? 'Create another playbook' : 'Create a playbook'}
        </PrimaryButton>
      </div>
      {hasWorkflow && <NextStepLink onClickCelebrate={onClickCelebrate} />}
      <SlideInDialog
        isOpen={step === 'playbook'}
        width="large"
        onClose={backToGS}
      >
        <div css={slideInPageStyle}>
          <DashboardNewWorkflow onCancel={backToGS} onDone={wrappedOnDone} />
        </div>
      </SlideInDialog>
    </div>
  );
};
