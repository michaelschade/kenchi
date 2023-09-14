import { useEffect, useMemo, useState } from 'react';

import { css } from '@emotion/react';
import { faFolder } from '@fortawesome/pro-solid-svg-icons';
import capitalize from 'lodash/capitalize';
import partition from 'lodash/partition';
import sortBy from 'lodash/sortBy';

import { LinkButton, PrimaryButton } from '@kenchi/ui/lib/Button';
import { FormGroup, InputGroup, Switch } from '@kenchi/ui/lib/Form';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { NameWithEmoji } from '@kenchi/ui/lib/NameWithEmoji';
import { Stack } from '@kenchi/ui/lib/Stack';

import useCollections from '../../collection/useCollections';
import { ActionableItem } from '../../components/ActionableItem';
import { CollectionPermissionEnum } from '../../graphql/generated';
import useSettings from '../../graphql/useSettings';
import useList from '../../list/useList';

const buttonStyle = css`
  gap: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

type Props = {
  sharedCollection?: string;
  onBack: () => void;
  onSubmit: (
    name: string,
    useGoogleDomain: boolean,
    collectionsToShare: string[]
  ) => void;
  loading: boolean;
};

export default function CreateOrgSettingsStep({
  sharedCollection,
  onBack,
  onSubmit,
  loading,
}: Props) {
  const settings = useSettings();
  const [useGoogleDomain, setUseGoogleDomain] = useState(false);
  const [name, setName] = useState('');
  const [collectionsToShare, setCollectionsToShare] = useState<string[]>([]);

  // Force a resync, even if we aren't using the data (we need more fields than this fetches)
  const { forceSync } = useList();
  useEffect(() => {
    forceSync();
    // Only run the first time we render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { collections } = useCollections('network-only');

  const googleDomain = settings?.viewer.user?.potentialGoogleDomain;

  useEffect(() => {
    if (googleDomain) {
      const parts = googleDomain.split('.');
      // Take the last part of the domain that's longer than 4 characters
      while (parts.length > 0 && parts[parts.length - 1].length <= 4) {
        parts.pop();
      }
      const name = parts.pop();
      if (name) {
        setName(capitalize(name));
      }
    }
  }, [googleDomain]);

  const myId = settings?.viewer.user?.id;
  const organizationId = settings?.viewer.organization?.id;
  const relevantCollections = useMemo(() => {
    const rtn = collections?.filter(
      (c) =>
        c.id !== sharedCollection &&
        (c.organization?.id === organizationId ||
          (!c.organization &&
            c.acl.some(
              (acl) =>
                acl.user?.id === myId &&
                acl.permissions.includes(CollectionPermissionEnum.admin)
            )))
    );
    return sortBy(rtn, (c) => c.name.toLowerCase());
  }, [collections, organizationId, myId, sharedCollection]);

  useEffect(() => {
    if (relevantCollections && relevantCollections.length > 1) {
      setCollectionsToShare(
        relevantCollections.filter((c) => c.name !== 'Private').map((c) => c.id)
      );
    }
  }, [relevantCollections]);

  const [toShare, notToShare] = partition(relevantCollections || [], (c) =>
    collectionsToShare.includes(c.id)
  );

  return (
    <>
      {googleDomain && (
        <Switch
          label={`Automatically add anyone with an @${googleDomain} email`}
          checked={useGoogleDomain}
          onCheckedChange={setUseGoogleDomain}
        />
      )}
      <InputGroup
        label="Organization Name"
        description="Usually your company name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {relevantCollections.length > 1 && (
        <>
          <FormGroup label="Collections to keep private">
            {notToShare.map((c) => (
              <ActionableItem
                key={c.id}
                label={
                  <NameWithEmoji
                    name={c.name}
                    emoji={c.icon}
                    fallbackIcon={faFolder}
                  />
                }
                onAdd={() => setCollectionsToShare((cts) => [...cts, c.id])}
              />
            ))}
          </FormGroup>
          <FormGroup label="Collections to share">
            <Stack>
              {toShare.map((c) => (
                <ActionableItem
                  key={c.id}
                  label={
                    <NameWithEmoji
                      name={c.name}
                      emoji={c.icon}
                      fallbackIcon={faFolder}
                    />
                  }
                  onRemove={() =>
                    setCollectionsToShare((cts) =>
                      cts.filter((id) => id !== c.id)
                    )
                  }
                />
              ))}
            </Stack>
          </FormGroup>
        </>
      )}
      <div css={buttonStyle}>
        <LinkButton onClick={onBack}>Skip for now</LinkButton>
        <PrimaryButton
          onClick={() => onSubmit(name, useGoogleDomain, collectionsToShare)}
        >
          Update {loading && <LoadingSpinner name="create org settings step" />}
        </PrimaryButton>
      </div>
    </>
  );
}
