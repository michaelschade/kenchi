import { useEffect, useState } from 'react';

import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import tw from 'twin.macro';

import { Stack } from '@kenchi/ui/lib/Stack';
import { linkStyle } from '@kenchi/ui/lib/Text';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

import { AuthTypeEnum } from '../graphql/generated';
import useSettings from '../graphql/useSettings';
import { hasVisibleOrg } from '../graphql/utils';
import { forgivingSessionGet, forgivingSessionSet } from '../utils';

const HIDE_KEY = 'hideLoginAs';

export const LoginAsNotice = () => {
  const settings = useSettings();
  const [shown, setShown] = useState(true);

  const sessionId = settings?.viewer.session?.id;
  useEffect(() => {
    if (shown && sessionId && forgivingSessionGet(HIDE_KEY) === sessionId) {
      setShown(false);
    }
  }, [shown, sessionId]);

  if (!shown || !settings) {
    return null;
  }

  if (settings.viewer.session?.type !== AuthTypeEnum.loginAs) {
    return null;
  }

  const viewer = settings.viewer;
  const userInOrg = hasVisibleOrg(viewer);
  const email = viewer.user?.email;
  const hide = () => {
    if (sessionId) {
      forgivingSessionSet(HIDE_KEY, sessionId);
      setShown(false);
    }
  };

  return (
    <div
      css={tw`bg-yellow-300 p-2 text-sm text-black flex justify-between items-start`}
    >
      <Stack direction="horizontal" gap={2}>
        <span>
          You are logged in as {email}
          {userInOrg && (
            <>
              {' '}
              on {viewer.organization.name} ({viewer.organization.id})
            </>
          )}
          .
        </span>
        <UnstyledLink to="/login-as/return">Log out</UnstyledLink> &bull;{' '}
        <span css={linkStyle} onClick={hide}>
          Hide for session
        </span>
      </Stack>
      <button
        type="button"
        css={tw`flex border-0 bg-transparent p-1 opacity-30 hover:opacity-100 transition`}
        onClick={(event) => {
          event.preventDefault();
          setShown(false);
        }}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
};
