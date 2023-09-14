import React, { useEffect, useState } from 'react';

import { css } from '@emotion/react';
import capitalize from 'lodash/capitalize';

import { LinkButton, PrimaryButton } from '@kenchi/ui/lib/Button';
import { InputGroup, Switch } from '@kenchi/ui/lib/Form';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { useToast } from '@kenchi/ui/lib/Toast';
import { useFormState } from '@kenchi/ui/lib/useFormState';

import ErrorAlert from '../../components/ErrorAlert';
import { errorFromMutation } from '../../graphql/errorFromMutation';
import useSettings from '../../graphql/useSettings';
import { hasVisibleOrg } from '../../graphql/utils';
import EmailListFormGroup from '../../space/createOrg/EmailListFormGroup';
import useCreateOrg from '../../space/createOrg/useCreateOrg';
import useInviteTeam from '../../space/createOrg/useInviteTeam';
import useUpdateOrgSettings from '../../space/createOrg/useUpdateOrgSettings';
import { pluralize } from '../../utils';
import { trackEvent } from '../../utils/analytics';
import { NextStepLink } from './NextStepLink';
import { useQuickstartStatus } from './useQuickstartStatus';

function getPotentialName(googleDomain?: string | null) {
  if (!googleDomain) {
    return undefined;
  }
  const parts = googleDomain.split('.');
  // Take the last part of the domain that's longer than 4 characters
  while (parts.length > 0 && parts[parts.length - 1].length <= 4) {
    parts.pop();
  }
  const name = parts.pop();
  return capitalize(name);
}

enum UpdateStatusEnum {
  Idle = 'idle',
  Loading = 'loading',
  Error = 'error',
  Success = 'success',
}

export const InviteTeamStep = ({
  onClickCelebrate,
}: {
  onClickCelebrate: () => void;
}) => {
  useEffect(() => {
    trackEvent({
      category: 'quickstart',
      action: 'open_invite_team',
    });
  }, []);
  const [orgSettingsUpdateStatus, setOrgSettingsUpdateStatus] = useState(
    UpdateStatusEnum.Idle
  );
  const [invitationStatus, setInvitationStatus] = useState(
    UpdateStatusEnum.Idle
  );
  const { hasInvitedUser, refetch, setSkippedInviteTeam, skippedInviteTeam } =
    useQuickstartStatus();
  const settings = useSettings();
  const viewer = settings?.viewer;
  const userInOrg = hasVisibleOrg(viewer);

  const useGoogleDomainState = useFormState(
    !!viewer?.organization?.googleDomain,
    false
  );

  const potentialGoogleDomain = settings?.viewer.user?.potentialGoogleDomain;
  // User can set google domain if...
  // they have a potential google domain AND they are not in a visible org (i.e. the org is a shadow record)
  //  OR
  // they have a potential google domain AND the org does not have a google domain
  //  OR
  // they have a potential google domain AND the org's google domain matches the potential google domain
  const canSetGoogleDomain =
    potentialGoogleDomain &&
    (!userInOrg ||
      !viewer.organization.googleDomain ||
      viewer.organization.googleDomain === potentialGoogleDomain);
  const nameState = useFormState(
    viewer?.organization?.name ?? getPotentialName(potentialGoogleDomain),
    ''
  );

  const settingsChanged =
    nameState.hasChanged || useGoogleDomainState.hasChanged;

  const [createOrg, createOrgResult] = useCreateOrg({
    onError: () => {},
    refetchQueries: ['SettingsQuery'],
  });

  const [updateSettings, updateSettingsResult] = useUpdateOrgSettings();

  const [emails, setEmails] = useState<string[]>([]);
  const [successfulInviteCount, setSuccessfulInviteCount] = useState(0);

  const [inviteTeam, { loading: inviteTeamLoading, results, resetResults }] =
    useInviteTeam();

  const { triggerToast } = useToast();
  useEffect(() => {
    if (orgSettingsUpdateStatus === UpdateStatusEnum.Success) {
      triggerToast({ message: `Organization settings updated` });
    }
  }, [orgSettingsUpdateStatus, triggerToast]);

  useEffect(() => {
    if (invitationStatus === UpdateStatusEnum.Success) {
      triggerToast({
        message: `${pluralize(successfulInviteCount, 'invitation')} sent`,
      });
      resetResults();
    }
  }, [invitationStatus, resetResults, successfulInviteCount, triggerToast]);

  const submit = async () => {
    if (!settingsChanged && emails.length === 0) {
      return;
    }
    if (settingsChanged) {
      setOrgSettingsUpdateStatus(UpdateStatusEnum.Loading);
    }
    if (emails.length > 0) {
      setInvitationStatus(UpdateStatusEnum.Loading);
    }
    if (!userInOrg) {
      const res = await createOrg();
      if (res.errors || res.data?.modify.error) {
        if (settingsChanged) {
          setOrgSettingsUpdateStatus(UpdateStatusEnum.Error);
        }
        if (emails.length > 0) {
          setInvitationStatus(UpdateStatusEnum.Error);
        }
        return;
      }
    }
    if (settingsChanged) {
      const res = await updateSettings({
        variables: {
          name: nameState.value,
          useGoogleDomain: canSetGoogleDomain
            ? useGoogleDomainState.value
            : undefined,
        },
      });
      if (res.errors || res.data?.modify.error) {
        setOrgSettingsUpdateStatus(UpdateStatusEnum.Error);
      } else {
        setOrgSettingsUpdateStatus(UpdateStatusEnum.Success);
      }
    }
    if (emails.length > 0) {
      const res = await inviteTeam(emails);
      setSuccessfulInviteCount(
        emails.filter((email) => res[email].success).length
      );
      setEmails((emails) => emails.filter((email) => !res[email].success));
      if (Object.entries(results).every(([, result]) => !result.success)) {
        setInvitationStatus(UpdateStatusEnum.Error);
      } else {
        setInvitationStatus(UpdateStatusEnum.Success);
        trackEvent({
          category: 'quickstart',
          action: 'complete_invite_team',
        });
      }
    }
    refetch();
  };

  const resultsEntries = Object.entries(results);
  const badEmails = resultsEntries
    .filter((e) => !e[1].success)
    .map((e) => e[0]);

  let submitLabel = '';
  if (emails.length > 0) {
    submitLabel = `Invite ${pluralize(emails.length, 'user')}`;
    if (settingsChanged) {
      submitLabel = `Save and ${submitLabel.toLowerCase()}`;
    }
  } else {
    submitLabel = 'Save';
  }

  const anyLoading =
    createOrgResult.loading ||
    updateSettingsResult.loading ||
    inviteTeamLoading;
  return (
    <div
      css={css`
        display: grid;
        gap: 1rem;
      `}
    >
      <div>
        <InputGroup
          label="Organization name"
          description="Usually your company name"
          value={nameState.value}
          onChange={(e) => {
            setOrgSettingsUpdateStatus(UpdateStatusEnum.Idle);
            nameState.set(e.target.value);
          }}
          autoFocus
          spellCheck={false}
        />
        <EmailListFormGroup
          label="Team members to invite"
          emails={emails}
          setEmails={(emails) => {
            setInvitationStatus(UpdateStatusEnum.Idle);
            resetResults();
            setEmails(emails);
          }}
        />
        {canSetGoogleDomain && (
          <Switch
            label={`Let colleagues with @${potentialGoogleDomain} emails join your organization`}
            checked={useGoogleDomainState.value}
            onCheckedChange={(checked) => {
              useGoogleDomainState.set(checked);
              setOrgSettingsUpdateStatus(UpdateStatusEnum.Idle);
            }}
            leftLabel
          />
        )}
        <div>
          <PrimaryButton
            disabled={(emails.length === 0 && !settingsChanged) || anyLoading}
            onClick={submit}
          >
            {submitLabel}
            {anyLoading && (
              <>
                {' '}
                <LoadingSpinner />
              </>
            )}
          </PrimaryButton>
          {!hasInvitedUser && (
            <LinkButton
              disabled={skippedInviteTeam}
              onClick={() => {
                trackEvent({
                  category: 'quickstart',
                  action: 'skip_invite_team',
                });
                setSkippedInviteTeam(true);
              }}
            >
              {skippedInviteTeam ? 'Skipped for now' : 'Skip for now'}
            </LinkButton>
          )}
        </div>
        {badEmails.length > 0 && (
          <p style={{ marginTop: '0.5rem' }}>
            Unable to invite {pluralize(badEmails.length, 'user')}, they may
            already have {badEmails.length > 1 ? 'accounts' : 'an account'}.
          </p>
        )}
        <ErrorAlert
          title="Error saving settings"
          error={
            errorFromMutation(updateSettingsResult) ||
            errorFromMutation(createOrgResult)
          }
        />
      </div>
      {(hasInvitedUser || skippedInviteTeam) && (
        <NextStepLink onClickCelebrate={onClickCelebrate} />
      )}
    </div>
  );
};
