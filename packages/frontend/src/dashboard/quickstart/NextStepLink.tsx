import { css } from '@emotion/react';
import { faArrowRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

import { StepsEnum, useQuickstartStatus } from './useQuickstartStatus';

const stepLabels = {
  [StepsEnum.createPlaybook]: 'Create a playbook',
  [StepsEnum.createSnippet]: 'Create a snippet',
  [StepsEnum.installExtension]: 'Add Kenchi to Chrome',
  [StepsEnum.inviteTeam]: 'Invite your team',
  [StepsEnum.complete]: 'Celebrate',
};

export const NextStepLink = ({
  onClickCelebrate,
}: {
  onClickCelebrate: () => void;
}) => {
  const { firstIncompleteStep } = useQuickstartStatus();
  const nextStep = firstIncompleteStep || StepsEnum.complete;
  return (
    <UnstyledLink
      to={`/dashboard/quickstart?tab=${nextStep}`}
      onClick={nextStep === StepsEnum.complete ? onClickCelebrate : undefined}
      css={css`
        display: inline-grid;
        gap: 0.5rem;
        grid-template-columns: auto 1fr;
        align-items: center;
        transition: gap 150ms ease;

        &:hover {
          text-decoration: none;
          gap: 0.6rem;
        }
      `}
    >
      <span>Next step: {stepLabels[nextStep as keyof typeof stepLabels]}</span>
      <FontAwesomeIcon icon={faArrowRight} />
    </UnstyledLink>
  );
};
