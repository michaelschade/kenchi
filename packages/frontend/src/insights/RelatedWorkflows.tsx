import { css } from '@emotion/react';
import { faFileInvoice } from '@fortawesome/pro-solid-svg-icons';
import sortBy from 'lodash/sortBy';

import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { PreloadedTable, TableRowLink } from '@kenchi/ui/lib/Dashboard/Table';
import {
  SidebarCardEmptyState,
  SidebarCardLoadingContents,
} from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';
import { HelpIcon } from '@kenchi/ui/lib/HelpIcon';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { NameWithEmoji } from '@kenchi/ui/lib/NameWithEmoji';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import { ToolFragment } from '../graphql/generated';
import { useRelatedWorkflows } from '../tool/useRelatedWorkflows';
import { useStatePagination } from '../utils/useStatePagination';

type RelatedWorkflowsProps = {
  tool: ToolFragment;
};

export const RelatedWorkflows = ({ tool }: RelatedWorkflowsProps) => {
  const { relatedWorkflows, loading } = useRelatedWorkflows(tool?.staticId);
  const [page, _setPage, PaginationLink] = useStatePagination();

  if (loading) {
    return (
      <ContentCard title="Used in&hellip;">
        <SidebarCardLoadingContents />
      </ContentCard>
    );
  }

  const sortedRelatedWorkflows = sortBy(relatedWorkflows, (workflow) =>
    workflow.name.toLocaleLowerCase()
  );

  return (
    <ContentCard title="Used in&hellip;" fullBleed>
      {loading && (
        <SidebarCardEmptyState>
          <LoadingSpinner name="related workflows" />
        </SidebarCardEmptyState>
      )}

      <PreloadedTable
        rowsPerPage={3}
        emptyState={
          <SidebarCardEmptyState>
            No playbooks
            <HelpIcon
              placement="top"
              content="Embed this snippet into a playbook to help your team discover it."
            />
          </SidebarCardEmptyState>
        }
        data={sortedRelatedWorkflows}
        page={page}
        PaginationLink={PaginationLink}
        rowRender={(workflow) => (
          <TableRowLink
            to={`/dashboard/playbooks/${workflow.staticId}`}
            key={workflow.staticId}
          >
            <Tooltip placement="left" overlay={<div>{workflow.name}</div>}>
              <td
                className="no-right-padding"
                css={css`
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  overflow: hidden;
                  max-width: 16rem;
                `}
              >
                <NameWithEmoji
                  name={workflow.name}
                  emoji={workflow.icon}
                  fallbackIcon={faFileInvoice}
                />
              </td>
            </Tooltip>
          </TableRowLink>
        )}
        showUselessPagination={false}
      />
    </ContentCard>
  );
};
