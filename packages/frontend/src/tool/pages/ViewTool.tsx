import { useCallback, useState } from 'react';

import { css } from '@emotion/react';
import { faArrowLeft, faPencilAlt } from '@fortawesome/pro-solid-svg-icons';
import { captureMessage } from '@sentry/react';
import { useHistory, useParams } from 'react-router-dom';

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
import { NotificationAlert } from '../../notifications/NotificationAlert';
import { useMarkNotifications } from '../../notifications/useMarkNotifications';
import { trackEvent } from '../../utils/analytics';
import { sendToEdit } from '../../utils/history';
import InteractiveTool from '../InteractiveTool';
import useTool from '../useTool';

const itemWrapper = css`
  color: hsl(213deg 15% 25%);
  background: hsl(240deg 40% 99%);
  overflow-wrap: break-word;
`;

export default function ViewTool() {
  const { id, branchId } = useParams<{ id: string; branchId?: string }>();
  const history = useHistory();
  const [infoCardIsOpen, setInfoCardIsOpen] = useState(false);

  const editTool = useCallback(
    () =>
      sendToEdit(history, {
        __typename: 'ToolLatest',
        staticId: id,
        branchId: branchId || null,
      }),
    [history, id, branchId]
  );

  useHotkey('e', editTool);
  useHotkey('i', () => setInfoCardIsOpen(!infoCardIsOpen));

  const { loading, error, tool } = useTool(id);

  const [
    markNotifications,
    { loading: markNotificationsLoading, error: markNotificationsError },
  ] = useMarkNotifications();

  if (!tool) {
    if (loading) {
      return <Loading name="view tool" />;
    } else if (error) {
      return <ErrorAlert title="Error loading snippet" error={error} />;
    } else {
      captureMessage('Snippet not found');
      return <NotFoundAlert title="Snippet not found" />;
    }
  }

  const dismissNotifications = () => {
    if (!markNotificationsError) {
      markNotifications({ staticId: tool.staticId, viewed: false });
    }
  };

  return (
    <>
      <HeaderBar>
        <HeaderIconLink onClick={() => history.goBack()} icon={faArrowLeft} />

        <SectionHeader title={tool.name}>{tool.name}</SectionHeader>

        <BranchBadge item={tool} itemName="snippet" />
        {!tool.isArchived && (
          <HeaderIconLink
            onClick={editTool}
            title="Edit snippet"
            icon={faPencilAlt}
          />
        )}
        <InfoCardPopover
          item={tool}
          isOpen={infoCardIsOpen}
          onOpenChange={setInfoCardIsOpen}
        />
      </HeaderBar>

      {!markNotificationsLoading && tool.hasActiveNotifications && (
        <NotificationAlert
          title="Review updates to this snippet"
          description="Read up on the latest changes since you last used this snippet."
          onClick={() => setInfoCardIsOpen(true)}
          onDismiss={() => dismissNotifications()}
        />
      )}

      <ContentContainer css={itemWrapper}>
        <Stack gap={4}>
          <VersionedNodeArchivedNotice type="snippet" node={tool} />
          <InteractiveTool
            inEditMode={true}
            tool={tool}
            trackAction={(action: string) =>
              trackEvent({
                category: 'tools',
                action,
                object: tool.staticId,
                source: 'view_tool_page',
              })
            }
          />
        </Stack>
      </ContentContainer>
    </>
  );
}
