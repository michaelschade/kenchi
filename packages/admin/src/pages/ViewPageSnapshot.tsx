import { useEffect, useRef, useState } from 'react';

import { gql, useQuery } from '@apollo/client';
import { DateTime } from 'luxon';
import { useHistory, useParams } from 'react-router-dom';

import {
  PageSnapshotQuery,
  PageSnapshotQueryVariables,
} from '../graphql/generated';

const QUERY = gql`
  query PageSnapshotQuery($id: ID!) {
    adminNode(id: $id) {
      ... on PageSnapshot {
        id
        createdAt
        user {
          id
          email
        }
        snapshot
      }
    }
  }
`;

export default function ViewPageSnapshot() {
  const [newSnapshotId, setNewSnapshotId] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { data, loading } = useQuery<
    PageSnapshotQuery,
    PageSnapshotQueryVariables
  >(QUERY, { variables: { id } });

  const pageSnapshot =
    data?.adminNode?.__typename === 'PageSnapshot' ? data.adminNode : null;
  const snapshot = pageSnapshot ? pageSnapshot.snapshot : null;

  useEffect(() => {
    if (!iframeRef.current) {
      return;
    }
    let content = snapshot.html;
    content = content.replace(/<iframe[^>]*kenchi-iframe[^>]*><\/iframe>/, '');
    content = content.replace(
      /<script[^>]*"https:\/\/scripts\.kenchi[^>]*><\/script>/g,
      ''
    );
    content = content.replace(/window.sentryDsn\s*=/g, 'window.notSentryDsn =');
    iframeRef.current?.contentWindow?.postMessage({ html: '' }, '*');
    window.setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({ html: content }, '*');
    }, 100);
  }, [iframeRef, snapshot]);

  if (!pageSnapshot || !snapshot) {
    if (loading) {
      return <>Loading</>;
    } else {
      return <>Error</>;
    }
  }

  const origin = window.location.origin;
  // TODO: body.outerHTML doesn't allow replacement of the HTML tag.
  const iframeSrc = `data:text/html,<script>
    window.addEventListener('message', function (e) {
      if (${JSON.stringify(origin)} !== e.origin) {
        console.error('Invalid origin');
        return;
      }
      document.body.outerHTML = e.data.html;
    });
  </script>`;

  return (
    <>
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            history.push(newSnapshotId);
          }}
        >
          Navigate to snapshot ID:
          <input
            type="text"
            value={newSnapshotId}
            onChange={(e) => setNewSnapshotId(e.target.value)}
          />
          <input type="submit" value="Go" />
        </form>
      </div>
      <div>{DateTime.fromISO(pageSnapshot.createdAt).toRelative()}</div>
      <div>User: {pageSnapshot.user?.email}</div>
      <iframe
        src={iframeSrc}
        sandbox="allow-scripts"
        ref={iframeRef}
        title="snapshot"
        style={{ width: '100%', height: '500px' }}
      />
    </>
  );
}
