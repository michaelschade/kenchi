import { useQuery } from '@apollo/client';
import { faExclamationTriangle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import gql from 'graphql-tag';

import Loading from '@kenchi/ui/lib/Loading';

import ErrorAlert from '../../components/ErrorAlert';
import { ToolListItemFragment } from '../../graphql/fragments';
import {
  ToolElementQuery,
  ToolElementQueryVariables,
} from '../../graphql/generated';
import PreviewTile from '../../previewTile/PreviewTile';
import Tool from '../../tool/Tool';
import { isTool } from '../../utils/versionedNode';

export const QUERY = gql`
  query ToolElementQuery($staticId: String!) {
    versionedNode(staticId: $staticId) {
      ...ToolListItemFragment
    }
  }
  ${ToolListItemFragment}
`;

export default function ToolElement({ id }: { id: string }) {
  const { loading, error, data } = useQuery<
    ToolElementQuery,
    ToolElementQueryVariables
  >(QUERY, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    variables: { staticId: id },
  });

  let tool = null;
  if (data?.versionedNode && isTool(data.versionedNode)) {
    tool = data.versionedNode;
  }

  if (!tool) {
    if (error) {
      return <ErrorAlert title="Error loading snippet" error={error} />;
    } else if (loading) {
      return <Loading name="tool element" />;
    } else {
      return (
        <PreviewTile
          name="Snippet not found"
          icon={
            <div className="tool-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} size="sm" />
            </div>
          }
          onClick={() => {}}
          actionEnabled={false}
          style={{ background: '#fff', position: 'relative' }}
        />
      );
    }
  }

  return <Tool tool={tool} editType="modal" analyticsSource="workflow" />;
}
