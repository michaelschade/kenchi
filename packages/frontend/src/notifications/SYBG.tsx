import { useCallback } from 'react';

import { css } from '@emotion/react';
import { useHistory } from 'react-router-dom';

import { NotificationsQuery, NotificationTypeEnum } from '../graphql/generated';
import { NotificationAlert } from './NotificationAlert';
import { useMarkNotifications } from './useMarkNotifications';

type NotificationEdges = NonNullable<
  NotificationsQuery['viewer']['user']
>['notifications']['edges'];
type Props = {
  notificationEdges: NotificationEdges | undefined;
};

export const SYBG = ({ notificationEdges }: Props) => {
  const history = useHistory();
  const showWhatsNew = useCallback(() => history.push('/whats-new'), [history]);
  const [mark] = useMarkNotifications();

  if (!notificationEdges) {
    return null;
  }

  const features = notificationEdges.filter(
    (n) => n.node.notification.type === 'product_major_change'
  ).length;
  const workflows = notificationEdges.filter((n) =>
    n.node.notification.type.startsWith('workflow_')
  ).length;
  const tools = notificationEdges.filter((n) =>
    n.node.notification.type.startsWith('tool_')
  ).length;
  if (features + workflows + tools === 0) {
    return null;
  }

  let description;
  const allChanged = features > 0 && workflows > 0 && tools > 0;
  const onlySnippetsChanged = features === 0 && workflows === 0 && tools > 0;
  const onlyPlaybooksChanged = features === 0 && workflows > 0 && tools === 0;
  const onlyFeaturesChanged = features > 0 && workflows === 0 && tools === 0;
  const onlyFeaturesAndSnippetsChanged =
    features > 0 && workflows > 0 && tools === 0;
  const onlyFeaturesAndPlaybooksChanged =
    features > 0 && workflows === 0 && tools > 0;
  const onlySnippetsAndPlaybooksChanged =
    features === 0 && workflows > 0 && tools > 0;

  if (allChanged) {
    description = `Check out the latest playbook and snippet changes (and ${
      features > 1 ? 'new Kenchi features' : 'a new Kenchi feature'
    }!) since you've last been here.`;
  } else if (onlyFeaturesAndPlaybooksChanged) {
    description = `Check out the latest playbook ${
      workflows > 1 ? 'changes' : 'change'
    } (and ${
      features > 1 ? 'new Kenchi features' : 'a new Kenchi feature'
    }!) since you've last been here.`;
  } else if (onlyFeaturesAndSnippetsChanged) {
    description = `Check out the latest snippet ${
      tools > 1 ? 'changes' : 'change'
    } (and ${
      features > 1 ? 'new Kenchi features' : 'a new Kenchi feature'
    }!) since you've last been here.`;
  } else if (onlySnippetsAndPlaybooksChanged) {
    description =
      "Check out the latest playbook and snippet changes since you've last been here.";
  } else if (onlyFeaturesChanged) {
    description = `Learn about our latest ${
      features === 1 ? 'update' : 'updates'
    } to Kenchi since you've last been here.`;
  } else if (onlyPlaybooksChanged) {
    description = `See the latest playbook ${
      workflows === 1 ? 'change' : 'changes'
    } since you've last been here.`;
  } else if (onlySnippetsChanged) {
    description = `See the latest snippet ${
      tools === 1 ? 'change' : 'changes'
    } since you've last been here.`;
  } else {
    // Impossible
    description = `There've been changes since you've last been here.`;
  }

  return (
    <NotificationAlert
      title="Since you've been gone…"
      description={description}
      onClick={showWhatsNew}
      onDismiss={() =>
        mark({
          viewed: false,
          types: [
            NotificationTypeEnum.product_major_change,
            NotificationTypeEnum.workflow_archived,
            NotificationTypeEnum.workflow_created,
            NotificationTypeEnum.workflow_major_change,
            NotificationTypeEnum.tool_archived,
            NotificationTypeEnum.tool_created,
            NotificationTypeEnum.tool_major_change,
          ],
        })
      }
      style={css({ marginBottom: '10px' })}
    />
  );
};
