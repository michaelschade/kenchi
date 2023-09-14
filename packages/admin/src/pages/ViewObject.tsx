import { useState } from 'react';

import { gql, useQuery } from '@apollo/client';
import { css } from '@emotion/react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { PrimaryButton } from '@kenchi/ui/lib/Button';
import { PageContainer } from '@kenchi/ui/lib/Dashboard/PageContainer';
import { Input } from '@kenchi/ui/lib/Form';

import SimpleRenderer from '../components/SimpleRenderer';
import { ObjectQuery, ObjectQueryVariables } from '../graphql/generated';

const OBJECT_QUERY = gql`
  query ObjectQuery($id: String!) {
    versionedNode(staticId: $id) {
      id
      staticId
      branchId
      ... on Tool {
        name
        icon
        description
        component
        configuration
      }
      ... on Workflow {
        name
        icon
        description
        contents
      }
    }
  }
`;

function ViewVersionedNode({ id }: { id: string }) {
  const { data, loading, error } = useQuery<ObjectQuery, ObjectQueryVariables>(
    OBJECT_QUERY,
    { variables: { id } }
  );

  const obj = data?.versionedNode;
  if (!obj) {
    if (loading) {
      return <>Loading</>;
    } else if (obj === null) {
      return <>Not found</>;
    } else {
      return <>Error: {error}</>;
    }
  }

  switch (obj.__typename) {
    case 'SpaceLatest':
      return (
        <PageContainer heading="Space">
          We don't support rendering spaces in admin right now
        </PageContainer>
      );
    case 'WorkflowLatest':
      return (
        <PageContainer heading={obj.name}>
          <SimpleRenderer contents={obj.contents} />
        </PageContainer>
      );
    case 'ToolLatest':
      return (
        <PageContainer heading={obj.name} subheading={obj.description}>
          {obj.component === 'GmailAction' ? (
            <SimpleRenderer contents={obj.configuration.data.children} />
          ) : (
            'Only GmailAction components can be displayed in Admin'
          )}
        </PageContainer>
      );
  }
}

// Stolen from backend/api/utils.ts
const encodeId = (prefix: string, id: number) => {
  // Add a bunch of digits so the IDs aren't too short.
  return prefix + '_n' + encode(id * 100000);
};

const decodeId = (id: string): [string, number] => {
  const [prefix, encoded] = id.split('_');
  return [prefix, decode(encoded.substr(1)) / 100000];
};

// DO NOT CHANGE THIS
const CHARSET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function encode(int: number) {
  if (int === 0) {
    return CHARSET[0];
  }

  let res = '';
  while (int > 0) {
    res = CHARSET[int % 62] + res;
    int = Math.floor(int / 62);
  }
  return res;
}

function decode(str: string) {
  const length = str.length;
  let res = 0,
    i,
    char;
  for (i = 0; i < length; i++) {
    char = str.charCodeAt(i);
    if (char < 58) {
      // 0-9
      char = char - 48;
    } else if (char < 91) {
      // A-Z
      char = char - 29;
    } else {
      // a-z
      char = char - 87;
    }
    res += char * Math.pow(62, length - i - 1);
  }
  return res;
}

const idFormStyle = css`
  max-width: 300px;
  margin-left: 2rem;

  form {
    display: flex;
    gap: 0.5rem;

    & > div {
      flex-grow: 1;
    }

    & > button {
      flex-shrink: 1;
    }
  }
`;

function IDForm({ initialValue }: { initialValue?: string }) {
  const [id, setId] = useState(initialValue);
  const history = useHistory();
  return (
    <div css={idFormStyle}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          history.push(`/object/${id}`);
        }}
      >
        <Input value={id} onChange={(e) => setId(e.target.value)} />
        <PrimaryButton type="submit" disabled={id === initialValue}>
          View
        </PrimaryButton>
      </form>
    </div>
  );
}

export default function ViewObject() {
  const { id } = useParams<{ id?: string }>();

  let content;
  if (id) {
    if (id.startsWith('org_')) {
      return <Redirect to={`/organizations/${id}`} />;
    } else if (parseInt(id)) {
      const encodedId = encodeId('prefix', parseInt(id));
      content = `Encoded ID: ${encodedId}`;
    } else {
      content = <ViewVersionedNode id={id} />;
      try {
        const decodedId = decodeId(id)[1];
        if (Number.isInteger(decodedId)) {
          content = `Decoded ID: ${decodedId}`;
        }
      } catch (e) {}
    }
  }

  return (
    <>
      <IDForm initialValue={id} />
      {content}
    </>
  );
}
