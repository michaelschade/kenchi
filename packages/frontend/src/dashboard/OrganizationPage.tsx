import { useEffect, useState } from 'react';

import { gql, useMutation, useQuery } from '@apollo/client';
import { faCheckCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { parse, stringify } from 'qs';
import { useHistory, useLocation } from 'react-router-dom';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { PageContainer } from '@kenchi/ui/lib/Dashboard/PageContainer';
import { InputGroup } from '@kenchi/ui/lib/Form';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { useFormState } from '@kenchi/ui/lib/useFormState';

import ErrorAlert, { NotFoundAlert } from '../components/ErrorAlert';
import { MutateButton } from '../components/MutateButton';
import { KenchiErrorFragment } from '../graphql/fragments';
import {
  OrganizationQuery,
  UpdateOrganizationMutation,
  UpdateOrganizationMutationVariables,
} from '../graphql/generated';
import { useHasOrgPermission } from '../graphql/useSettings';
import { hasVisibleOrg } from '../graphql/utils';

const INTERCOM_STATE_KEY = 'intercomOauthState';

const QUERY = gql`
  query OrganizationQuery {
    viewer {
      organization {
        id
        name
        hasIntercomAccessToken
        shadowRecord
      }
    }
  }
`;

const MUTATION = gql`
  mutation UpdateOrganizationMutation($name: String, $intercomCode: String) {
    modify: updateOrganization(name: $name, intercomCode: $intercomCode) {
      error {
        ...KenchiErrorFragment
      }
      organization {
        id
        name
        hasIntercomAccessToken
      }
    }
  }
  ${KenchiErrorFragment}
`;

const OrganizationPage = () => {
  const { data, loading, error } = useQuery<OrganizationQuery>(QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const [mutate, mutationResult] = useMutation<
    UpdateOrganizationMutation,
    UpdateOrganizationMutationVariables
  >(MUTATION);
  const canModify = useHasOrgPermission('manage_org_settings');

  const viewer = data?.viewer;
  const userInOrg = hasVisibleOrg(viewer);

  const nameState = useFormState(viewer?.organization?.name || '', '');

  if (!data) {
    if (loading) {
      return <LoadingSpinner />;
    } else if (error) {
      return <ErrorAlert title="Error loading organization" error={error} />;
    } else {
      throw new Error('Should not ever happen');
    }
  }

  if (!userInOrg) {
    return <NotFoundAlert title="You don't have an organization yet" />;
  } else if (!canModify) {
    return (
      <NotFoundAlert title="You do not have permission to change organization settings" />
    );
  }

  const save = () => {
    mutate({ variables: { name: nameState.value } });
  };

  const name = viewer.organization.name || 'Your organization';
  const title = `${name}'s settings`;

  return (
    <PageContainer meta={{ title }} heading={title}>
      <ContentCard>
        <InputGroup
          label="Organization name"
          value={nameState.value}
          onChange={(e) => nameState.set(e.target.value)}
        />
        <MutateButton result={mutationResult} onClick={save}>
          Save
        </MutateButton>
        <ErrorAlert
          title="Error saving organization details"
          error={mutationResult.error}
        />
      </ContentCard>
      <InsightsSettings name={name} org={viewer.organization} />
    </PageContainer>
  );
};

const InsightsSettings = ({
  name,
  org,
}: {
  name: string;
  org: NonNullable<OrganizationQuery['viewer']['organization']>;
}) => {
  const [mutate, mutationResult] = useMutation<
    UpdateOrganizationMutation,
    UpdateOrganizationMutationVariables
  >(MUTATION);

  const location = useLocation();
  const history = useHistory();
  const [error, setError] = useState<null | 'state' | 'code'>(null);
  useEffect(() => {
    if (!location.pathname.endsWith('/intercom')) {
      return;
    }
    const { code, state } = parse(window.location.search.substring(1));
    const expectedState = window.localStorage.getItem(INTERCOM_STATE_KEY);
    if (!expectedState || state !== expectedState) {
      setError('state');
      return;
    } else if (typeof code !== 'string') {
      setError('code');
      return;
    }
    mutate({ variables: { intercomCode: code } });
    history.replace('/dashboard/organization');
  }, [location, history, mutate]);

  const startOauth = () => {
    const state = `${Math.random()}`.split('.')[1];
    window.localStorage.setItem(INTERCOM_STATE_KEY, state);
    const args = {
      client_id: process.env.REACT_APP_INTERCOM_CLIENT_ID,
      state,
      redirect_uri: `${process.env.REACT_APP_HOST}/dashboard/organization/intercom`,
    };
    const url = `https://app.intercom.com/oauth?${stringify(args)}`;
    window.location.href = url;
  };

  return (
    <ContentCard title="Advanced Insights">
      {org.hasIntercomAccessToken ? (
        <>
          <FontAwesomeIcon icon={faCheckCircle} /> {name} is setup for advanced
          analytics.
        </>
      ) : (
        <>
          <MutateButton result={mutationResult} onClick={startOauth}>
            Connect Kenchi to Intercom
          </MutateButton>
          {error && (
            <ErrorAlert
              title="Error connecting Kenchi to Intercom"
              error={true}
            />
          )}
        </>
      )}
    </ContentCard>
  );
};

export default OrganizationPage;
