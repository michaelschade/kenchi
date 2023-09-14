import { useEffect, useState } from 'react';

import { faArrowCircleRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import MajorAlert from '@kenchi/ui/lib/MajorAlert';

import { trackEvent } from '../utils/analytics';

export default function NeedsUpdate() {
  const [badVersion, setBadVersion] = useState(false);

  useEffect(() => {
    if (badVersion) {
      return;
    }
    const checkVersions = () => {
      fetch(`${process.env.REACT_APP_API_HOST}/skip_versions`)
        .then((resp) => resp.json())
        .then((data) => {
          if (
            Array.isArray(data.versions) &&
            data.versions.includes(process.env.REACT_APP_SENTRY_VERSION)
          ) {
            trackEvent({
              category: 'update',
              action: 'needs_update_displayed',
            });
            setBadVersion(true);
          }
        })
        .catch((e) => console.log('Error fetching skip versions', e));
    };
    const interval = window.setInterval(checkVersions, 5 * 60 * 1000); // 5m
    checkVersions();
    return () => window.clearInterval(interval);
  }, [badVersion]);

  const refresh = () => {
    trackEvent({ category: 'update', action: 'frontend_refresh_clicked' });
    window.location.reload();
  };

  if (!badVersion) {
    return null;
  }
  return (
    <MajorAlert sticky={true}>
      We just released an important update.
      <span onClick={refresh}>
        Refresh to update Kenchi{' '}
        <FontAwesomeIcon icon={faArrowCircleRight} size="1x" />
      </span>
    </MajorAlert>
  );
}
