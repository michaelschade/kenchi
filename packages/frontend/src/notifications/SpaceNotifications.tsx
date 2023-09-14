import { NotificationTypeEnum } from '../graphql/generated';
import useSettings from '../graphql/useSettings';
import { hasVisibleOrg } from '../graphql/utils';
import CreateOrgPrompt from '../space/createOrg/Prompt';
import { SYBG } from './SYBG';
import { useNotifications } from './useNotifications';

export const SPACE_NOTIFICATIONS_VARIABLES = { active: true, first: 10 };

export const SpaceNotifications = () => {
  const settings = useSettings();

  const { data: notifications } = useNotifications(
    SPACE_NOTIFICATIONS_VARIABLES
  );

  const types = new Set(
    notifications?.edges.map((n) => n.node.notification.type) || []
  );

  let topNotification = null;
  if (
    types.has(NotificationTypeEnum.create_org_prompt) &&
    !hasVisibleOrg(settings?.viewer)
  ) {
    topNotification = <CreateOrgPrompt />;
  }

  return (
    <>
      {topNotification}
      <SYBG notificationEdges={notifications?.edges} />
    </>
  );
};
