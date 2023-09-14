import { useCallback, useEffect, useRef, useState } from 'react';

import { css } from '@emotion/react';
import {
  faArrowLeft,
  faPencilAlt,
  faTasks,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { captureMessage } from '@sentry/react';
import { DateTime } from 'luxon';
import { useHistory, useParams } from 'react-router-dom';

import Alert from '@kenchi/ui/lib/Alert';
import { BaseColors, KenchiTheme } from '@kenchi/ui/lib/Colors';
import Emoji from '@kenchi/ui/lib/Emoji';
import {
  HeaderBar,
  HeaderIconLink,
  SectionHeader,
} from '@kenchi/ui/lib/Headers';
import { ContentContainer } from '@kenchi/ui/lib/Layout';
import Loading from '@kenchi/ui/lib/Loading';
import { Stack } from '@kenchi/ui/lib/Stack';
import useHotkey from '@kenchi/ui/lib/useHotkey';

import { BranchBadge } from '../../components/BranchStatus';
import ErrorAlert, { NotFoundAlert } from '../../components/ErrorAlert';
import InfoCardPopover from '../../components/InfoCardPopover';
import { VersionedNodeArchivedNotice } from '../../components/VersionedNodeArchivedNotice';
import { BranchTypeEnum } from '../../graphql/generated';
import { SelectableList, SelectableListRef } from '../../list/SelectableList';
import { NotificationAlert } from '../../notifications/NotificationAlert';
import { useMarkNotifications } from '../../notifications/useMarkNotifications';
import { useUpdateSubscription } from '../../notifications/useUpdateSubscription';
import Renderer from '../../slate/Renderer';
import { sendToEdit } from '../../utils/history';
import useWorkflow from '../useWorkflow';

const workflowWrapper = ({ colors }: KenchiTheme) => css`
  color: ${colors.gray[12]};
  background-color: ${colors.gray[1]};
  overflow-wrap: break-word;

  // Empty <p> tags are default 0 height in HTML but normal height in Slate, so
  // adjust to match.
  p {
    min-height: 1.5em;
  }
`;

export default function ViewWorkflow() {
  const { id, branchId } = useParams<{ id: string; branchId?: string }>();
  const history = useHistory();
  const selectableListRef = useRef<SelectableListRef>(null);
  const [infoCardIsOpen, setInfoCardIsOpen] = useState(false);

  const editWorkflow = useCallback(
    () =>
      sendToEdit(history, {
        __typename: 'WorkflowLatest',
        staticId: id,
        branchId: branchId || null,
      }),
    [history, id, branchId]
  );

  useHotkey('e', editWorkflow);
  useHotkey('i', () => setInfoCardIsOpen(!infoCardIsOpen));

  const { loading, error, workflow } = useWorkflow(branchId || id);

  const [
    markNotifications,
    { loading: markNotificationsLoading, error: markNotificationsError },
  ] = useMarkNotifications();
  const [updateSubscription, { called: updateSubscriptionCalled }] =
    useUpdateSubscription();

  useEffect(() => {
    if (
      workflow &&
      !workflow.subscribed &&
      workflow.branchType === BranchTypeEnum.published &&
      !updateSubscriptionCalled
    ) {
      updateSubscription({
        variables: { staticId: workflow.staticId, subscribed: true },
      });
    }
  }, [workflow, updateSubscription, updateSubscriptionCalled]);

  if (!workflow) {
    if (loading) {
      return <Loading name="view workflow" />;
    } else if (error) {
      return <ErrorAlert title="Error loading playbook" error={error} />;
    } else {
      captureMessage('Playbook not found');
      return <NotFoundAlert title="Playbook not found" />;
    }
  }

  const dismissNotifications = () => {
    if (!markNotificationsError) {
      markNotifications({ staticId: workflow.staticId, viewed: false });
    }
  };

  const branchByUser = workflow.branches.edges[0]?.node;

  return (
    <>
      <HeaderBar>
        <HeaderIconLink onClick={() => history.goBack()} icon={faArrowLeft} />

        {workflow.icon && (
          <h2>
            <Emoji emoji={workflow.icon} />
          </h2>
        )}
        <SectionHeader>{workflow.name}</SectionHeader>

        <BranchBadge item={workflow} itemName="playbook" />
        {!workflow.isArchived && (
          <HeaderIconLink
            onClick={editWorkflow}
            title="Edit playbook"
            icon={faPencilAlt}
          />
        )}
        <InfoCardPopover
          item={workflow}
          isOpen={infoCardIsOpen}
          onOpenChange={setInfoCardIsOpen}
        />
      </HeaderBar>

      <ContentContainer css={workflowWrapper}>
        <Stack gap={4}>
          <VersionedNodeArchivedNotice type="playbook" node={workflow} />

          {branchByUser && (
            <Alert
              title="Your suggestion is under review"
              description={`The changes you proposed ${DateTime.fromISO(
                branchByUser.createdAt
              ).toRelative()} are currently awaiting approval. Click here to make any extra changes `}
              onClick={() => sendToEdit(history, branchByUser)}
              primaryColor={BaseColors.secondary}
              icon={
                <FontAwesomeIcon
                  icon={faTasks}
                  css={css`
                    font-size: 0.8rem;
                  `}
                />
              }
            />
          )}
          {!markNotificationsLoading && workflow.hasActiveNotifications && (
            <NotificationAlert
              title="Review updates to this playbook"
              description="Read up on the latest changes since you last used this playbook."
              onClick={() => setInfoCardIsOpen(true)}
              onDismiss={() => dismissNotifications()}
            />
          )}
          <SelectableList
            ref={selectableListRef}
            actionKeys={[]}
            scrollable={true}
          >
            <Renderer contents={workflow.contents} />
          </SelectableList>
        </Stack>
      </ContentContainer>
    </>
  );
}
