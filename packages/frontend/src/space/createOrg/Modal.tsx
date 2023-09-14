import { useCallback, useState } from 'react';

import { css } from '@emotion/react';
import { useHistory } from 'react-router-dom';

import { LinkButton, PrimaryButton } from '@kenchi/ui/lib/Button';
import { SectionHeader } from '@kenchi/ui/lib/Headers';

import ErrorAlert from '../../components/ErrorAlert';
import { CustomModal } from '../../components/Modals';
import { errorFromMutation } from '../../graphql/errorFromMutation';
import { QUERY } from '../../graphql/useSettings';
import logoSvg from '../../logos/black.svg';
import CreateUserResults from './CreateUserResults';
import CreateOrgInviteStep from './InviteStep';
import CreateOrgSettingsStep from './SettingsStep';
import useCreateOrg from './useCreateOrg';
import useInviteTeam from './useInviteTeam';
import useUpdateOrgSettings from './useUpdateOrgSettings';

const buttonStyle = css`
  gap: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

export default function CreateOrgModal({
  onClose,
  isOpen,
}: {
  onClose: () => void;
  isOpen: boolean;
}) {
  const [step, setStep] = useState<'invite' | 'settings' | 'done'>('invite');
  const [createOrg, createOrgStatus] = useCreateOrg({
    onError: () => {},
    refetchQueries: [{ query: QUERY }],
  });

  const [updateSettings, updateSettingsStatus] = useUpdateOrgSettings();
  const [inviteTeam, inviteTeamStatus] = useInviteTeam();

  const submitInvites = useCallback(
    (emails: string[]) => {
      (async () => {
        const org = await createOrg();
        if (org.data?.modify.error !== null) {
          return;
        }
        await inviteTeam(emails);
        setStep('settings');
      })();
    },
    [createOrg, inviteTeam]
  );

  const submitSettings = useCallback(
    (name: string, useGoogleDomain: boolean, collectionsToShare: string[]) => {
      (async () => {
        const res = await updateSettings({
          variables: { name, useGoogleDomain, collectionsToShare },
        });
        if (res.data?.modify.organization) {
          setStep('done');
        }
      })();
    },
    [updateSettings]
  );

  const history = useHistory();
  const orgName =
    updateSettingsStatus.data?.modify.organization?.name || 'your organization';

  return (
    <CustomModal
      isOpen={isOpen}
      onBack={onClose}
      title="Invite your team to Kenchi"
    >
      {step === 'invite' && (
        <>
          <CreateOrgInviteStep
            onBack={onClose}
            onSubmit={submitInvites}
            loading={createOrgStatus.loading || inviteTeamStatus.loading}
          />
          <ErrorAlert
            title="Error making team"
            error={errorFromMutation(createOrgStatus)}
          />
        </>
      )}
      {step === 'settings' && (
        <>
          <CreateUserResults data={inviteTeamStatus.results} />
          <CreateOrgSettingsStep
            sharedCollection={createOrgStatus.data?.modify.sharedCollection?.id}
            onSubmit={submitSettings}
            onBack={() => setStep('done')}
            loading={updateSettingsStatus.loading}
          />
          <ErrorAlert
            title="Error updating settings"
            error={errorFromMutation(updateSettingsStatus)}
          />
        </>
      )}
      {step === 'done' && (
        <>
          <SectionHeader>Welcome to Kenchi for Teams!</SectionHeader>
          <p>
            You can manage users, collections, and settings for {orgName} from
            the{' '}
            <img src={logoSvg} alt="Kenchi logo" style={{ height: '0.8em' }} />{' '}
            menu.
          </p>
          <div css={buttonStyle}>
            <LinkButton onClick={onClose}>Back to Kenchi</LinkButton>
            <PrimaryButton onClick={() => history.push('/dashboard')}>
              Manage {orgName}
            </PrimaryButton>
          </div>
        </>
      )}
    </CustomModal>
  );
}
