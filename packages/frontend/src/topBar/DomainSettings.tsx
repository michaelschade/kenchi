import { gql, useMutation } from '@apollo/client';
import { css } from '@emotion/react';
import { faPaintBrush } from '@fortawesome/pro-solid-svg-icons';

import { Select, Switch } from '@kenchi/ui/lib/Form';
import { HelpIcon } from '@kenchi/ui/lib/HelpIcon';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { MenuItem, MenuItemList, MenuSection } from '@kenchi/ui/lib/Menu';

import ErrorAlert from '../components/ErrorAlert';
import { getPersistorAsync } from '../graphql/cache';
import {
  DomainSettingsMutation,
  DomainSettingsMutationVariables,
} from '../graphql/generated';
import { useDomainSettings } from '../pageContext/domainSettings/useDomainSettings';
import { QUERY as SETTINGS_QUERY } from '../pageContext/domainSettings/useDomainSettingsQuery';
import { usePageUrl } from '../pageContext/pageUrl/usePageUrl';
import { isExtension } from '../utils';

const DOMAIN_SETTINGS_MUTATION = gql`
  mutation DomainSettingsMutation(
    $host: String!
    $open: Boolean
    $side: String
  ) {
    setUserDomainSettings(
      userDomainSettingsData: { host: $host, open: $open, side: $side }
    ) {
      userDomainSettings {
        id
        open
        side
      }
    }
  }
`;

const domainForm = css`
  display: grid;
  gap: 0.5rem;

  div.header {
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow-x: hidden;

    span {
      flex-shrink: 1;
      overflow-x: hidden;
      text-overflow: ellipsis;
    }
  }
`;

export const DomainSettings = () => {
  const [domainSettings, updateDomainSettings] = useDomainSettings();

  const pageUrl = usePageUrl();

  const [
    domainSettingsMutation,
    { loading: mutationLoading, error: mutationError },
  ] = useMutation<DomainSettingsMutation, DomainSettingsMutationVariables>(
    DOMAIN_SETTINGS_MUTATION,
    {
      refetchQueries: [{ query: SETTINGS_QUERY }],
      awaitRefetchQueries: true,
      onCompleted: async (data) => {
        if (data.setUserDomainSettings?.userDomainSettings) {
          // Force immediate sync
          (await getPersistorAsync()).persist();
        }
      },
    }
  );
  if (!isExtension() || !domainSettings) {
    return null;
  }
  const host = pageUrl?.host;
  const name = domainSettings.name || host;

  const placements = domainSettings?.customPlacements || {};

  const changePlacement = (side: string) => {
    updateDomainSettings({ side });
    if (host) {
      domainSettingsMutation({ variables: { host, side } });
    }
  };
  const changeDefaultOpen = (newOpen: boolean) => {
    updateDomainSettings({ open: newOpen });
    if (host) {
      domainSettingsMutation({ variables: { host, open: newOpen } });
    }
  };
  const domainDetails = (
    <div className="header">
      <span>On {name}&hellip;</span>
      <HelpIcon
        placement="left"
        content={
          <>
            Customize how Kenchi appears on <strong>{name}</strong>. Remember,
            you can always open Kenchi with <strong>ctrl + space</strong> and
            hide Kenchi with <strong>ctrl + shift + space</strong> on any page.
          </>
        }
      />
    </div>
  );

  let title;
  if (mutationLoading) {
    title = (
      <>
        Personalize Kenchi <LoadingSpinner />
      </>
    );
  } else {
    title = <>Personalize Kenchi</>;
  }

  const placementOptions = [
    {
      value: 'left',
      label: 'Float on left side',
    },
    {
      value: 'right',
      label: 'Float on right side',
    },
    ...Object.entries(placements).map(([value, { name }]) => ({
      value,
      label: name,
    })),
  ];

  return (
    <MenuSection title={title} icon={faPaintBrush}>
      <MenuItemList>
        <MenuItem>
          <div css={domainForm}>
            {domainDetails}
            <ErrorAlert
              title="Error updating domain settings"
              error={mutationError}
            />

            <Select
              disabled={mutationLoading}
              onSelect={changePlacement}
              options={placementOptions}
              size="small"
              value={domainSettings?.side || 'left'}
            />

            <Switch
              label="Open by default"
              checked={domainSettings?.open || false}
              disabled={mutationLoading}
              onCheckedChange={changeDefaultOpen}
            />
          </div>
        </MenuItem>
      </MenuItemList>
    </MenuSection>
  );
};
