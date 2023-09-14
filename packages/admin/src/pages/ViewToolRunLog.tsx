import { useEffect, useRef, useState } from 'react';

import { gql, useQuery } from '@apollo/client';
import { DateTime } from 'luxon';
import { useParams } from 'react-router-dom';

import {
  ToolRunLogQuery,
  ToolRunLogQueryVariables,
} from '../graphql/generated';

const QUERY = gql`
  query ToolRunLogQuery($id: ID!) {
    adminNode(id: $id) {
      ... on ToolRunLog {
        id
        createdAt
        tool {
          id
          name
          staticId
          configuration
        }
        user {
          id
          email
        }
        log
      }
    }
  }
`;

export default function ViewToolRunLog() {
  const [activeEntryIndex, setActiveEntryIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useQuery<ToolRunLogQuery, ToolRunLogQueryVariables>(
    QUERY,
    { variables: { id } }
  );

  const toolRunLog =
    data?.adminNode?.__typename === 'ToolRunLog' ? data.adminNode : null;
  const entries: any[] | null = toolRunLog ? toolRunLog.log : null;
  const activeEntry = entries?.[activeEntryIndex];

  useEffect(() => {
    if (!iframeRef.current) {
      return;
    }
    let content = activeEntry.snapshot.html;
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
  }, [activeEntryIndex, iframeRef, activeEntry]);

  if (!toolRunLog || !entries || !activeEntry) {
    if (loading) {
      return <>Loading</>;
    } else {
      return <>Error</>;
    }
  }

  const steps = toolRunLog.tool?.configuration.steps;

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

  let prevTimestamp: number | null = null;
  return (
    <>
      <div>{DateTime.fromISO(toolRunLog.createdAt).toRelative()}</div>
      <div>Tool: {toolRunLog.tool?.name}</div>
      <div>User: {toolRunLog.user?.email}</div>
      <div>
        <ul>
          {entries.map((e: any, i) => {
            const timestamp = prevTimestamp
              ? `${Math.round((e.timestamp - prevTimestamp) / 100) / 10}s later`
              : DateTime.fromISO(e.timestamp).toFormat('ff');
            prevTimestamp = e.timestamp;
            return (
              <li
                key={i}
                style={
                  activeEntryIndex === i
                    ? { fontWeight: 'bold' }
                    : { cursor: 'pointer' }
                }
                onClick={() => setActiveEntryIndex(i)}
              >
                {e.name} ({timestamp})
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        Step {activeEntry.stepIndex}:{' '}
        <pre>{JSON.stringify(steps[activeEntry.stepIndex], undefined, 2)}</pre>
      </div>
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
