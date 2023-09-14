import { useState } from 'react';

import { css } from '@emotion/react';
import { faUsers } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { NotificationAlert } from '../../notifications/NotificationAlert';
import CreateOrgModal from './Modal';

const cityStyle = css`
  position: relative;
  max-width: 15px;
`;

const notificationStyle = css`
  margin-bottom: 10px;
`;

export default function CreateOrgPrompt() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <CreateOrgModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <NotificationAlert
        icon={<FontAwesomeIcon icon={faUsers} css={cityStyle} />}
        title="Invite your team to Kenchi"
        description="Share your best practices, quick replies, and collaborate with your team with Kenchi"
        onClick={() => setShowModal(true)}
        onDismiss={() => {}}
        style={notificationStyle}
      />
    </>
  );
}
