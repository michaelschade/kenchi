import { gql, useMutation } from '@apollo/client';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons';
import { useHistory } from 'react-router-dom';

import { Switch } from '@kenchi/ui/lib/Form';
import {
  HeaderBar,
  HeaderIconLink,
  SectionHeader,
} from '@kenchi/ui/lib/Headers';
import { ContentContainer } from '@kenchi/ui/lib/Layout';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { Stack } from '@kenchi/ui/lib/Stack';
import { Link } from '@kenchi/ui/lib/Text';

import ErrorAlert from '../components/ErrorAlert';
import {
  LogoutMutation,
  UserSettingsMutation,
  UserSettingsMutationVariables,
} from '../graphql/generated';
import useSettings from '../graphql/useSettings';
import { purgeAndRedirect } from '../login/utils';
import { isExtension } from '../utils';
import { CapturePageSnapshotLink } from './CapturePageSnapshotLink';
import { ImportLinks } from './ImportLinks';

const LOGOUT = gql`
  mutation LogoutMutation {
    logout {
      viewer {
        user {
          id
        }
        organization {
          id
        }
      }
    }
  }
`;

const USER_SETTINGS_MUTATION = gql`
  mutation UserSettingsMutation($wantsEditSuggestionEmails: Boolean!) {
    updateUserSettings(wantsEditSuggestionEmails: $wantsEditSuggestionEmails) {
      user {
        id
        wantsEditSuggestionEmails
      }
    }
  }
`;

export default function UserSettings({ onBack }: { onBack: () => void }) {
  const history = useHistory();
  const settings = useSettings();

  const [logout, { loading: logoutLoading, error: logoutError }] =
    useMutation<LogoutMutation>(LOGOUT, {
      // Login page reset the cache
      onCompleted: () => history.push('/login'),
    });

  const [mutateUserSettings, userSettingsMutation] = useMutation<
    UserSettingsMutation,
    UserSettingsMutationVariables
  >(USER_SETTINGS_MUTATION);

  return (
    <>
      <HeaderBar>
        <HeaderIconLink onClick={onBack} icon={faArrowLeft} />
        <SectionHeader>Settings</SectionHeader>
      </HeaderBar>

      <ContentContainer>
        <Stack gap={4}>
          {settings?.viewer.user ? (
            <>
              <div>Logged in as {settings.viewer.user.email}</div>
              <Switch
                label="Email me when my team suggests content changes"
                checked={
                  settings.viewer.user.wantsEditSuggestionEmails || false
                }
                disabled={!settings.viewer.user || userSettingsMutation.loading}
                onCheckedChange={(wantsEditSuggestionEmails) => {
                  if (!settings.viewer.user) return;
                  mutateUserSettings({
                    variables: { wantsEditSuggestionEmails },
                  });
                }}
              />
            </>
          ) : null}

          <Stack gap={2}>
            <Stack>
              <Link onClick={() => logout()}>
                Logout {logoutLoading && <LoadingSpinner name="logout" />}
              </Link>
              <ErrorAlert title="Unable to log you out" error={logoutError} />
            </Stack>

            {isExtension() && (
              <>
                <CapturePageSnapshotLink />
                <ImportLinks />
              </>
            )}

            <Link onClick={() => purgeAndRedirect()}>Clear cache</Link>
          </Stack>
        </Stack>
      </ContentContainer>
    </>
  );
}
