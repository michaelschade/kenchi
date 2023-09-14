import { useEffect, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { DateTime } from 'luxon';

import Avatar from '@kenchi/ui/lib/Dashboard/Avatar';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { PreloadedTable } from '@kenchi/ui/lib/Dashboard/Table';
import { ContentCardTabs } from '@kenchi/ui/lib/Dashboard/Tabs';
import {
  SidebarCardEmptyState,
  SidebarCardLoadingContents,
} from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';

import ErrorAlert from '../../components/ErrorAlert';
import {
  ToolFragment,
  VersionFragment,
  WorkflowFragment,
} from '../../graphql/generated';
import { useNodeChanges } from '../../graphql/useChanges';
import { useMarkNotifications } from '../../notifications/useMarkNotifications';
import { PreviewRenderer } from '../../slate/Renderer';
import { trackEvent } from '../../utils/analytics';
import { pastDateString } from '../../utils/time';
import { useStatePagination } from '../../utils/useStatePagination';
import { isWorkflow } from '../../utils/versionedNode';

const TableRow = styled.tr`
  font-size: 0.875rem;
  line-height: 1.25rem;
`;

type VersionedNodeHistoryProps = {
  versionedNode: WorkflowFragment | ToolFragment;
};

export const VersionedNodeHistory = ({
  versionedNode,
}: VersionedNodeHistoryProps) => {
  const itemType = isWorkflow(versionedNode) ? 'workflow' : 'tool';
  const [onlyMajor, setOnlyMajor] = useState(false);
  const { loading, error, data } = useNodeChanges({
    staticId: versionedNode.staticId,
    onlyMajor: false,
    first: 1000,
  });
  const [markNotifications, { called }] = useMarkNotifications();
  const [page, _setPage, PaginationLink] = useStatePagination();
  const hasChanges = (data?.publishedVersions?.length || 0) > 0;

  useEffect(() => {
    if (!hasChanges || called) {
      return;
    }
    markNotifications({
      staticId: versionedNode.staticId,
      viewed: true,
    });
  }, [versionedNode, markNotifications, hasChanges, called]);

  const updateOnlyMajor = (value: boolean) => {
    setOnlyMajor(value);
    trackEvent({
      category: `${itemType}.history_card`,
      action: `history_show_${value ? 'major' : 'all'}`,
    });
  };

  const versionFilterFn = (version: VersionFragment) => {
    if (onlyMajor) {
      return !!version.majorChangeDescription;
    }
    return true;
  };

  const filteredVersions = data?.publishedVersions?.filter(versionFilterFn);

  if (loading) {
    return (
      <ContentCard title="Edit history">
        <SidebarCardLoadingContents />
      </ContentCard>
    );
  }

  return (
    <ContentCard title="Edit history" fullBleed>
      <ErrorAlert title="Error fetching history" error={error} />
      {data?.publishedVersions && (
        <>
          <ContentCardTabs
            value={onlyMajor ? 'major' : 'all'}
            onChange={(value) => updateOnlyMajor(value === 'major')}
            options={[
              {
                label: 'All',
                value: 'all',
              },
              {
                label: 'Major changes',
                value: 'major',
              },
            ]}
          />
          <PreloadedTable
            emptyState={
              <SidebarCardEmptyState>
                None. Choose{' '}
                <span
                  css={css`
                    font-weight: 600;
                  `}
                >
                  Publish and Alert
                </span>{' '}
                from the Publish button menu to notify your team about about
                important changes.
              </SidebarCardEmptyState>
            }
            data={filteredVersions || []}
            page={page}
            PaginationLink={PaginationLink}
            rowRender={(version) => (
              <TableRow key={version.id}>
                <td className="shrink-to-fit no-right-padding align-top">
                  <Avatar user={version.createdByUser} />
                </td>
                <td>
                  <div>
                    {pastDateString(DateTime.fromISO(version.createdAt))}
                  </div>
                  {version.majorChangeDescription && (
                    <PreviewRenderer
                      contents={version.majorChangeDescription}
                    />
                  )}
                </td>
              </TableRow>
            )}
            showUselessPagination={false}
            rowsPerPage={3}
          />
        </>
      )}
    </ContentCard>
  );
};
