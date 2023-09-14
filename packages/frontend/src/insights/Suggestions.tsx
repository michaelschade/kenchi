import { DateTime } from 'luxon';

import Avatar from '@kenchi/ui/lib/Dashboard/Avatar';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { PreloadedTable, TableRowLink } from '@kenchi/ui/lib/Dashboard/Table';

import { ToolFragment, WorkflowFragment } from '../graphql/generated';
import { useStatePagination } from '../utils/useStatePagination';
import { useSuggestions } from './useSuggestions';

type SuggestionsProps = {
  versionedNode: ToolFragment | WorkflowFragment;
};

export const Suggestions = ({ versionedNode }: SuggestionsProps) => {
  const { suggestions } = useSuggestions(versionedNode.staticId);
  const [page, _setPage, PaginationLink] = useStatePagination();
  if (!suggestions) {
    return null;
  }
  return (
    <ContentCard title="Open suggestions" fullBleed>
      <PreloadedTable
        data={suggestions}
        page={page}
        PaginationLink={PaginationLink}
        rowRender={(suggestion) => {
          return (
            <TableRowLink
              to={`/dashboard/suggestions/${suggestion.branchId}`}
              key={suggestion.branchId}
            >
              <td className="shrink-to-fit no-right-padding">
                <Avatar user={suggestion.createdByUser} />
              </td>
              <td>{DateTime.fromISO(suggestion.createdAt).toRelative()}</td>
            </TableRowLink>
          );
        }}
        showUselessPagination={false}
      />
    </ContentCard>
  );
};
