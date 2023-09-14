import { css } from '@emotion/react';
import { faBriefcaseMedical } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';

import Alert from '@kenchi/ui/lib/Alert';
import { BaseColors } from '@kenchi/ui/lib/Colors';

import { useRecovery } from '../slate/Editor/Recovery';
import { trackEvent } from '../utils/analytics';
import { pastDateString } from '../utils/time';

const iconStyle = css`
  font-size: 0.95em;
`;

type RecoveryAlertProps = {
  itemType: 'tool' | 'workflow';
};

const RecoveryAlert = ({ itemType }: RecoveryAlertProps) => {
  const { hasRecovery, dropRecovery, recover } = useRecovery();
  if (!hasRecovery) {
    return null;
  }
  return (
    <Alert
      primaryColor={BaseColors.error}
      title="Restore unsaved changes"
      icon={<FontAwesomeIcon icon={faBriefcaseMedical} css={iconStyle} />}
      onClick={() => {
        trackEvent({
          category: `${itemType}_editor`,
          action: 'recovery_accept',
          label: 'Accept offer to recover unsaved changes',
        });
        recover();
      }}
      onDismiss={() => {
        trackEvent({
          category: `${itemType}_editor`,
          action: 'recovery_dismiss',
          label: 'Dismiss recovery',
        });
        dropRecovery();
      }}
      containerStyle={css`
        margin-bottom: 10px;
      `}
      description={`You have some unsaved changes from ${pastDateString(
        DateTime.fromMillis(hasRecovery)
      )}. Click here to recover those edits `}
    />
  );
};

export default RecoveryAlert;
