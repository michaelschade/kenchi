import { useCallback, useEffect, useMemo, useState } from 'react';

import { gql, useQuery } from '@apollo/client';
import { captureException } from '@sentry/react';

import { SlateNode } from '@kenchi/slate-tools/lib/types';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import useHotkey from '@kenchi/ui/lib/useHotkey';

import { SpaceFragment } from '../graphql/fragments';
import { HudSpacesQuery } from '../graphql/generated';
import useGoogleAPI from '../login/useGoogleApi';
import { useLogin } from '../login/useLogin';
import { defaultGetAuthToken } from '../login/utils';
import { SearchProvider } from '../search/useSearch';
import { isMessageRouterErrorType } from '../utils';
import { getSavedSpaceId, saveSpaceId } from '../utils/spaceUrl';
import useMessageRouter, {
  useMessageRouterReady,
} from '../utils/useMessageRouter';
import PromptForLogin from './PromptForLogin';
import SearchResults from './SearchResults';
import TopBar, { defaultSpaceKey } from './TopBar';

export const QUERY = gql`
  query HudSpacesQuery {
    viewer {
      user {
        id
        spaces(first: 1000) {
          edges {
            node {
              ...SpaceFragment
            }
          }
        }
      }
    }
  }
  ${SpaceFragment}
`;

export default function Hud() {
  const [doLogin, loginStatus] = useLogin({
    getAuthToken: defaultGetAuthToken,
    // useLogin already broadcasts login state and we don't need a page reload,
    // so nothing to do here.
    onSuccess: () => {},
  });
  const { data, loading, error } = useQuery<HudSpacesQuery>(QUERY, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [currentSpaceId, setCurrentSpaceId] = useState<string>(
    getSavedSpaceId(defaultSpaceKey) || '__ALL__'
  );
  useGoogleAPI();
  const router = useMessageRouter<'hud'>();
  useEffect(() => {
    router
      .sendCommand('contentScript', 'injectScript', { name: 'hud' })
      .catch((e) => {
        if (!isMessageRouterErrorType(e, 'alreadyInjected')) {
          throw e;
        }
      });
  }, [router]);

  useHotkey(
    'Escape',
    useCallback(() => router.sendCommand('pageScript', 'hud:hide'), [router])
  );

  const spaces = useMemo(() => {
    if (!data || !data.viewer.user) {
      if (loading) {
        return null;
      } else if (error) {
        captureException(error);
      }
      return [];
    } else {
      return data.viewer.user.spaces.edges.map((edge) => edge.node);
    }
  }, [data, error, loading]);

  const currentSpace = useMemo(
    () => spaces?.find((space) => space.staticId === currentSpaceId),
    [currentSpaceId, spaces]
  );
  useMessageRouterReady<'hud'>('contentScript');
  const collectionIds = currentSpace?.widgets
    .map((w: SlateNode) =>
      w.type === 'widget-collection' ? w.collectionId : null
    )
    .filter((w: string | null): w is string => w !== null);
  const nonEmptySpaces =
    spaces?.filter(
      (space) => space.widgets.length > 0 || space.staticId === currentSpaceId
    ) ?? null;

  const isLoading = loginStatus.loading || loading;
  return (
    <>
      <TopBar
        spaces={nonEmptySpaces}
        currentSpaceId={currentSpaceId}
        onSpaceSelect={(spaceId) => {
          setCurrentSpaceId(spaceId);
          saveSpaceId(spaceId, defaultSpaceKey);
        }}
      />
      {isLoading ? (
        <LoadingSpinner />
      ) : data?.viewer.user ? (
        <SearchProvider>
          <SearchResults collectionIds={collectionIds} />
        </SearchProvider>
      ) : (
        <PromptForLogin doLogin={doLogin} loginStatus={loginStatus} />
      )}
    </>
  );
}
