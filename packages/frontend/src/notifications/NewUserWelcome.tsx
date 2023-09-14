import { css } from '@emotion/react';

import { NotificationTypeEnum } from '../graphql/generated';
import logoSvg from '../logos/black.svg';
import { NotificationAlert, ringAnimation } from './NotificationAlert';
import { useMarkNotifications } from './useMarkNotifications';

const logoStyle = css`
  position: relative;
  max-width: 15px;
  top: -2px;
`;

// We used to show this to all new users and no longer do. Leaving it for posterity.
export const NewUserWelcome = () => {
  const [mark] = useMarkNotifications();

  return (
    <NotificationAlert
      icon={<img src={logoSvg} alt="" css={[logoStyle, ringAnimation]} />}
      primaryColor="hsl(10deg 55% 61%)"
      title="Welcome to Kenchi!"
      description="There's a lot packed into Kenchi to help save you time. Get up to speed quickly with our intro video"
      onClick={() => {
        mark({ types: [NotificationTypeEnum.new_user_welcome], viewed: true });
        window.open(
          'https://www.loom.com/share/ef55a648430744dda8e0d74f207e401d',
          '_blank'
        );
      }}
      onDismiss={() =>
        mark({ types: [NotificationTypeEnum.new_user_welcome], viewed: false })
      }
      style={css({ marginBottom: '10px' })}
    />
  );
};
