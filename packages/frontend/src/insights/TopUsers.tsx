import { useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { faChevronDown, faChevronUp } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import orderBy from 'lodash/orderBy';
import { DateTime } from 'luxon';

import { SecondaryButton } from '@kenchi/ui/lib/Button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@kenchi/ui/lib/Collapsible';
import Avatar from '@kenchi/ui/lib/Dashboard/Avatar';
import ContentCard from '@kenchi/ui/lib/Dashboard/ContentCard';
import { Pill } from '@kenchi/ui/lib/Dashboard/Pill';
import { SidebarCardLoadingContents } from '@kenchi/ui/lib/Dashboard/ViewAndEditContent';

import { ToolFragment, WorkflowFragment } from '../graphql/generated';
import { pluralize } from '../utils';
import { useTopUsage } from './useTopUsage';

const AVATARS_PER_ROW = 7;
const ROWS_WHEN_COLLAPSED = 1;
const AVATAR_COUNT_WHEN_COLLAPSED = AVATARS_PER_ROW * ROWS_WHEN_COLLAPSED;
const COLUMNS_FOR_MORE_INDICATOR = 1;

const Title = styled.div`
  align-items: center;
  display: grid;
  gap: 0.5rem;
  grid-auto-flow: column;
`;

const AvatarGrid = styled.div`
  align-items: center;
  display: grid;
  gap: 0.45rem;
  grid-template-columns: repeat(${AVATARS_PER_ROW}, 1fr);
  padding: 0 0.5rem;
`;

const AvatarGridContainer = styled.div`
  padding: 0.5rem;
`;

const ToggleForShowAll = styled(SecondaryButton)`
  align-items: center;
  border-radius: 500px;
  cursor: default;
  display: grid;
  font-size: 0.875rem;
  height: 2rem;
  justify-content: center;
  width: 2rem;
`;

type TopUsersProps = {
  versionedNode: ToolFragment | WorkflowFragment;
  startDate: DateTime;
  endDate: DateTime;
};

export const TopUsers = ({
  versionedNode,
  startDate,
  endDate,
}: TopUsersProps) => {
  const { topUsage = [], loading } = useTopUsage({
    staticId: versionedNode.staticId,
    startDate,
    endDate,
  });
  const [shouldShowAll, setShouldShowAll] = useState(false);

  if (loading) {
    return (
      <ContentCard title="Top users">
        <SidebarCardLoadingContents />
      </ContentCard>
    );
  }

  if (topUsage.length === 0) {
    return null;
  }

  const renderAvatars = (start: number, end?: number) =>
    orderBy(topUsage, 'count', 'desc')
      .slice(start, end)
      .map(({ node: user, count }) => (
        <Avatar
          user={user}
          key={user.id}
          extraInfo={`Used ${pluralize(count, 'time')}`}
        />
      ));

  const maxAvatarsInUpperSegment =
    shouldShowAll || topUsage.length <= AVATAR_COUNT_WHEN_COLLAPSED
      ? AVATAR_COUNT_WHEN_COLLAPSED
      : AVATAR_COUNT_WHEN_COLLAPSED - COLUMNS_FOR_MORE_INDICATOR;

  const shouldBeExpandable = topUsage.length > AVATAR_COUNT_WHEN_COLLAPSED;
  const shouldShowCollapse = shouldBeExpandable && shouldShowAll;
  const shouldShowExpand = shouldBeExpandable && !shouldShowAll;

  return (
    <ContentCard
      title={
        <Title>
          Top users
          <Pill>{topUsage.length}</Pill>
        </Title>
      }
      fullBleed
    >
      <AvatarGridContainer>
        <Collapsible>
          <AvatarGrid>
            {renderAvatars(0, maxAvatarsInUpperSegment)}
            {shouldShowExpand && (
              <CollapsibleTrigger asChild>
                <ToggleForShowAll
                  size="tiny"
                  onClick={() => setShouldShowAll((prev) => !prev)}
                >
                  <FontAwesomeIcon icon={faChevronDown} />
                </ToggleForShowAll>
              </CollapsibleTrigger>
            )}
          </AvatarGrid>
          <CollapsibleContent>
            <AvatarGrid
              css={css`
                padding-top: 0.45rem;
              `}
            >
              {renderAvatars(AVATAR_COUNT_WHEN_COLLAPSED)}
              {shouldShowCollapse && (
                <CollapsibleTrigger asChild>
                  <ToggleForShowAll
                    size="tiny"
                    onClick={() => setShouldShowAll((prev) => !prev)}
                  >
                    <FontAwesomeIcon icon={faChevronUp} />
                  </ToggleForShowAll>
                </CollapsibleTrigger>
              )}
            </AvatarGrid>
          </CollapsibleContent>
        </Collapsible>
      </AvatarGridContainer>
    </ContentCard>
  );
};
