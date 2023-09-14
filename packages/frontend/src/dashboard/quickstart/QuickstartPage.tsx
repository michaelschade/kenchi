import { useEffect, useMemo, useState } from 'react';

import { css, useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { faCircle } from '@fortawesome/pro-regular-svg-icons';
import { faCheckCircle, faTimesCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Redirect, useLocation } from 'react-router-dom';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import PageContainer from '@kenchi/ui/lib/Dashboard/PageContainer';
import { ContentCardTabs } from '@kenchi/ui/lib/Dashboard/Tabs';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import Confetti, { TIMEOUT } from '../../components/Confetti';
import useTabValue from '../useTabValue';
import { AllStepsComplete } from './AllStepsComplete';
import { CreatePlaybookStep } from './CreatePlaybookStep';
import { CreateSnippetStep } from './CreateSnippetStep';
import { InstallExtensionStep } from './InstallExtensionStep';
import { InviteTeamStep } from './InviteTeamStep';
import {
  QuickstartStatusProvider,
  StepsEnum,
  useQuickstartStatus,
} from './useQuickstartStatus';

const StepsContent = styled.section`
  min-height: 16rem;
  padding: 2rem 2.5rem;
`;

const VerticalTabsCardLayout = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
`;

const LabelContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const QuickstartPage = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (!showConfetti) {
      return;
    }
    const confettiTimeout = setTimeout(() => setShowConfetti(false), TIMEOUT);
    return () => clearTimeout(confettiTimeout);
  }, [showConfetti]);
  const {
    colors: { gray },
  } = useTheme();

  const {
    isLoggedIn,
    hasWorkflow,
    hasTool,
    hasExtension,
    hasInvitedUser,
    loading,
    refetch,
    firstIncompleteStep,
    skippedInviteTeam,
  } = useQuickstartStatus();

  const complete =
    hasWorkflow &&
    hasTool &&
    hasExtension &&
    (skippedInviteTeam || hasInvitedUser);

  const iconForInviteTeam = useMemo(() => {
    if (hasInvitedUser) {
      return faCheckCircle;
    }
    if (skippedInviteTeam) {
      return faTimesCircle;
    }
    return faCircle;
  }, [hasInvitedUser, skippedInviteTeam]);

  const tabOptions = useMemo(
    () => [
      {
        label: (
          <LabelContainer>
            <span>Create a snippet</span>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <FontAwesomeIcon
                color={'current'}
                icon={hasTool ? faCheckCircle : faCircle}
              />
            )}
          </LabelContainer>
        ),
        value: StepsEnum.createSnippet,
      },
      {
        label: (
          <LabelContainer>
            <span>Create a playbook</span>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <FontAwesomeIcon
                color={'current'}
                icon={hasWorkflow ? faCheckCircle : faCircle}
              />
            )}
          </LabelContainer>
        ),
        value: StepsEnum.createPlaybook,
      },
      {
        label: (
          <LabelContainer>
            <span>Add Kenchi to Chrome</span>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <FontAwesomeIcon
                color={'current'}
                icon={hasExtension ? faCheckCircle : faCircle}
              />
            )}
          </LabelContainer>
        ),
        value: StepsEnum.installExtension,
      },
      {
        label: (
          <LabelContainer>
            <span>Invite your team</span>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <FontAwesomeIcon color={'current'} icon={iconForInviteTeam} />
            )}
          </LabelContainer>
        ),
        value: StepsEnum.inviteTeam,
      },
      {
        disabled: !complete,
        label: (
          <LabelContainer
            css={css`
              transform: ${complete ? 'translateX(3px)' : ''};
            `}
            onClick={() => {
              if (!complete) {
                return;
              }
              setShowConfetti(true);
            }}
          >
            <span>All done</span>
            {loading && <LoadingSpinner />}
            {!loading && !complete && (
              <FontAwesomeIcon color={gray[7]} icon={faCircle} />
            )}
            {!loading && complete && (
              <span
                css={css`
                  font-size: 1.25rem;
                `}
              >
                🥳
              </span>
            )}
          </LabelContainer>
        ),
        value: StepsEnum.complete,
      },
    ],
    [
      loading,
      hasTool,
      hasWorkflow,
      hasExtension,
      iconForInviteTeam,
      complete,
      gray,
    ]
  );

  const { tabValue, setTabValue } = useTabValue(tabOptions, {
    defaultTabValue: firstIncompleteStep || StepsEnum.complete,
  });

  const location = useLocation();
  if (!isLoggedIn && !loading) {
    const to = `${location.pathname}${location.search}`;
    return <Redirect to={`/dashboard/login?to=${encodeURIComponent(to)}`} />;
  }

  return (
    <PageContainer
      meta={{ title: 'Quickstart' }}
      heading="Quickstart"
      subheading="Everything you need to get up and running on Kenchi"
      width="lg"
    >
      <ContentCard fullBleed>
        <VerticalTabsCardLayout>
          <ContentCardTabs
            orientation="vertical"
            alignTabLabels="right"
            options={tabOptions}
            value={tabValue}
            onChange={(value) => setTabValue(value as StepsEnum)}
            extraTabsListStyle={css`
              padding-left: 1rem;
              padding-top: 1.6rem;
            `}
          />
          <StepsContent>
            {tabValue === StepsEnum.createPlaybook && (
              <CreatePlaybookStep
                onDone={refetch}
                onClickCelebrate={() => setShowConfetti(true)}
              />
            )}
            {tabValue === StepsEnum.createSnippet && (
              <CreateSnippetStep
                onDone={refetch}
                onClickCelebrate={() => setShowConfetti(true)}
              />
            )}
            {tabValue === StepsEnum.installExtension && (
              <InstallExtensionStep
                onClickCelebrate={() => setShowConfetti(true)}
              />
            )}
            {tabValue === StepsEnum.inviteTeam && (
              <InviteTeamStep onClickCelebrate={() => setShowConfetti(true)} />
            )}
            {tabValue === StepsEnum.complete && <AllStepsComplete />}
          </StepsContent>
        </VerticalTabsCardLayout>
      </ContentCard>
      <Confetti render={showConfetti} />
    </PageContainer>
  );
};

const QuickstartPageWithContext = () => (
  <QuickstartStatusProvider>
    <QuickstartPage />
  </QuickstartStatusProvider>
);

export default QuickstartPageWithContext;
