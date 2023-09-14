import { gql, useMutation } from '@apollo/client';
import { faArchive } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';

import Alert from '@kenchi/ui/lib/Alert';
import { BaseColors } from '@kenchi/ui/lib/Colors';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { Link } from '@kenchi/ui/lib/Text';

import {
  KenchiErrorFragment,
  ToolFragment,
  WorkflowFragment,
} from '../graphql/fragments';
import {
  BranchTypeEnum,
  RestoreToolMutation,
  RestoreToolMutationVariables,
  RestoreWorkflowMutation,
  RestoreWorkflowMutationVariables,
} from '../graphql/generated';

const RESTORE_TOOL_MUTATION = gql`
  mutation RestoreToolMutation($id: ID!) {
    restoreTool(id: $id) {
      error {
        ...KenchiErrorFragment
      }
      tool {
        ...ToolFragment
      }
    }
    ${ToolFragment}
    ${KenchiErrorFragment}
  }
`;

const RESTORE_WORKFLOW_MUTATION = gql`
  mutation RestoreWorkflowMutation($id: ID!) {
    restoreWorkflow(id: $id) {
      error {
        ...KenchiErrorFragment
      }
      workflow {
        ...WorkflowFragment
      }
    }
    ${WorkflowFragment}
    ${KenchiErrorFragment}
  }
`;

type Node = {
  id: string;
  staticId: string;
  isArchived: boolean;
  createdAt: string;
  createdByUser: { name: string | null };
  branchType: BranchTypeEnum;
};

type Props = {
  type: 'playbook' | 'snippet';
  node: Node;
};

export const VersionedNodeArchivedNotice = ({ type, node }: Props) => {
  const [restoreTool, restoreToolMutation] = useMutation<
    RestoreToolMutation,
    RestoreToolMutationVariables
  >(RESTORE_TOOL_MUTATION, { variables: { id: node.id } });

  const [restoreWorkflow, restoreWorkflowMutation] = useMutation<
    RestoreWorkflowMutation,
    RestoreWorkflowMutationVariables
  >(RESTORE_WORKFLOW_MUTATION, { variables: { id: node.id } });

  const restore = type === 'playbook' ? restoreWorkflow : restoreTool;
  const restoreMutation =
    type === 'playbook' ? restoreWorkflowMutation : restoreToolMutation;

  if (!node.isArchived) return null;
  if (
    node.branchType !== BranchTypeEnum.published &&
    node.branchType !== BranchTypeEnum.draft
  )
    return null;

  return (
    <Alert
      title="Archived"
      description={
        <>
          This {type}
          {node.branchType === BranchTypeEnum.draft ? ' draft' : ''} was
          archived {DateTime.fromISO(node.createdAt).toRelative()}
          {node.createdByUser.name ? (
            <> by {node.createdByUser.name}</>
          ) : null}.{' '}
          {restoreMutation.loading ? (
            <LoadingSpinner name="archived versioned node restore mutation" />
          ) : (
            <Link
              onClick={(event) => {
                event.preventDefault();
                restore();
              }}
            >
              {/* non-breaking space to avoid "restore" and "it" being on two separate lines */}
              Restore&nbsp;it?
            </Link>
          )}
        </>
      }
      primaryColor={BaseColors.warning}
      icon={<FontAwesomeIcon icon={faArchive} size="sm" />}
    />
  );
};
