import { useEffect, useState } from 'react';

import styled from '@emotion/styled';
import { faChevronUp, faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';

import { HEADER_HEIGHT_PX } from '@kenchi/ui/lib/Headers';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { linkStyle } from '@kenchi/ui/lib/Text';
import { ToggleButtonGroup } from '@kenchi/ui/lib/ToggleButton';
import Tooltip from '@kenchi/ui/lib/Tooltip';
import { useHotkeyRegion } from '@kenchi/ui/lib/useHotkey';

import {
  ToolFragment,
  VersionFragment,
  WorkflowFragment,
} from '../graphql/generated';
import { useNodeChanges } from '../graphql/useChanges';
import { useMarkNotifications } from '../notifications/useMarkNotifications';
import { PreviewRenderer } from '../slate/Renderer';
import { trackEvent } from '../utils/analytics';
import { pastDateString } from '../utils/time';
import { isTool, isWorkflow } from '../utils/versionedNode';
import ErrorAlert from './ErrorAlert';
import Pagination from './Pagination';

type OverlayProps = {
  isOpen: boolean;
};

const Overlay = styled.div<OverlayProps>`
  backdrop-filter: ${({ isOpen }) => (isOpen ? 'blur(2px)' : 'none')};
  background-color: ${({ isOpen }) =>
    isOpen ? ({ theme }) => theme.colors.subtleShadow : 'transparent'};
  bottom: 0;
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  top: ${HEADER_HEIGHT_PX}px;
  transition: all 0.3s ease-in-out;
  width: 100%;
  z-index: 1;
`;

const PopoverContent = styled(PopoverPrimitive.Content)`
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-1rem);
    }
  }

  &[data-state='open'] {
    animation: fadeIn 0.3s ease-in-out;
  }
  &[data-state='closed'] {
    animation: fadeOut 0.3s ease-in-out;
  }

  background: ${({ theme }) => theme.colors.gray[0]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[6]};
  box-shadow: 0px 5px 10px -5px ${({ theme }) => theme.colors.subtleShadow};
  color: ${({ theme }) => theme.colors.gray[12]};
  max-height: calc(100vh - ${HEADER_HEIGHT_PX}px);
  overflow-y: auto;
  padding: 15px 15px 5px 15px;
  width: 300px;

  .header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;

    span {
      flex-grow: 1;
      text-align: right;
    }
  }

  .date {
    font-weight: 500;
    font-size: 0.9rem;
  }

  section:not(:last-of-type) {
    margin-bottom: 15px;
  }

  h2 {
    font-size: 0.95em;
    font-weight: 700;
    line-height: 1;
    margin: 0;
  }

  p {
    font-size: 0.95em;
    margin-bottom: 0;
  }

  p.empty {
    font-size: 0.9em;
  }
`;

const PopoverTrigger = styled(PopoverPrimitive.Trigger)`
  border: none;
  padding: 0;
  margin: 0;
  background-color: transparent;
  color: ${({ theme: { colors } }) => colors.accent[8]};
  transition: color 0.2s ease-in-out;
  outline: none;

  &:hover,
  &:focus {
    color: ${({ theme: { colors } }) => colors.accent[9]};
  }
`;

const PopoverAnchor = styled(PopoverPrimitive.Anchor)`
  position: absolute;
  right: 0;
  top: 0;
  left: 0;
  width: 100%;
`;

const PopoverClose = styled(PopoverPrimitive.Close)`
  width: 100%;
  background: transparent;
  border: none;
  color: ${({ theme: { colors } }) => colors.gray[12]};
  opacity: 0.3;
  transition: opacity 0.2s ease-in-out;
  outline: none;

  &:hover,
  &:focus {
    opacity: 1;
  }
`;

const HistoryItemContent = styled.div`
  &:first-of-type {
    margin-top: 5px;
  }

  &:not(:last-of-type) {
    margin-bottom: 10px;
  }

  .header {
    margin: 0;

    span {
      opacity: 0.8;
      font-weight: 300;
      font-size: 0.9em;

      strong {
        font-weight: 400;
      }
    }
  }

  strong {
    font-size: 0.9em;
    font-weight: 600;
    margin: 0;
    color: #4a5156;
  }

  .description {
    p:not(:last-of-type) {
      margin-bottom: 10px;
    }

    opacity: 0.8;
    font-size: 0.9em;
    font-weight: 300;
  }
`;

function HistoryItem({ version }: { version: VersionFragment }) {
  const date = DateTime.fromISO(version.createdAt);

  let description = null;
  if (version.majorChangeDescription) {
    description = (
      <div className="description">
        <PreviewRenderer contents={version.majorChangeDescription} />
      </div>
    );
  }

  return (
    <HistoryItemContent>
      <div className="header">
        <div className="date">{pastDateString(date)}</div>
        <span>
          {version.isFirst ? 'created' : 'updated'} by{' '}
          {version.createdByUser.email?.split('@')?.[0] || ''}
        </span>
      </div>
      {description}
    </HistoryItemContent>
  );
}

type HistorySectionProps = {
  item: WorkflowFragment | ToolFragment;
};

const HistorySection = ({ item }: HistorySectionProps) => {
  const itemType = isWorkflow(item) ? 'workflow' : 'tool';
  const [onlyMajor, setOnlyMajor] = useState(true);
  const [afterStack, setAfterStack] = useState<string[]>([]);

  const { loading, error, data } = useNodeChanges({
    staticId: item.staticId,
    onlyMajor,
    first: 5,
    after: afterStack[0],
  });
  const [markNotifications, { called }] = useMarkNotifications();

  const hasChanges = (data?.publishedVersions?.length || 0) > 0;

  useEffect(() => {
    if (!hasChanges || called) {
      return;
    }
    markNotifications({
      staticId: item.staticId,
      viewed: true,
    });
  }, [item, markNotifications, hasChanges, called]);

  const updateOnlyMajor = (value: boolean) => {
    setAfterStack([]);
    setOnlyMajor(value);
    trackEvent({
      category: `${itemType}.info_card`,
      action: `history_show_${value ? 'major' : 'all'}`,
    });
  };

  const nextPage = () => {
    if (data?.publishedVersionsPageInfo?.endCursor) {
      setAfterStack([data.publishedVersionsPageInfo.endCursor, ...afterStack]);
    }
  };
  const hasNextPage = data?.publishedVersionsPageInfo?.hasNextPage || false;

  const prevPage = () => {
    const newAfterStack = [...afterStack];
    newAfterStack.shift();
    setAfterStack(newAfterStack);
  };
  const hasPrevPage = afterStack.length > 0;

  return (
    <section>
      <div className="header">
        <h2>History</h2>
        <ToggleButtonGroup
          onValueChange={(value) => updateOnlyMajor(value === 'major')}
          value={onlyMajor ? 'major' : 'all'}
          orientation="horizontal"
          type="single"
          size="tiny"
          items={[
            {
              label: 'All',
              value: 'all',
            },
            {
              label: 'Major',
              value: 'major',
            },
          ]}
        />
      </div>
      {loading && <LoadingSpinner name="info card history" />}
      <ErrorAlert title="Error fetching history" error={error} />
      {!loading && !hasChanges && (
        <p className="empty">
          No major changes. You can add an alert on the{' '}
          <Link
            css={linkStyle}
            to={`/${isWorkflow(item) ? 'playbook' : 'snippet'}s/${
              item.staticId
            }/edit`}
          >
            edit page
          </Link>{' '}
          to notify your team about about important changes.
        </p>
      )}
      {!loading &&
        data?.publishedVersions?.map((v) => (
          <HistoryItem key={v.id} version={v} />
        ))}
      <div style={{ marginTop: '15px' }}>
        <Pagination
          onPrev={hasPrevPage && prevPage}
          onNext={hasNextPage && nextPage}
        />
      </div>
    </section>
  );
};

// We have to do the two of these as separate types, not `__typename:
// 'Collection' | 'LimitedCollection'`, because Typescript can't use
// descriminated union types when the type param is itself a union.

type CollectionInfoCardItem = {
  __typename: 'Collection';
  description: string;
};

type LimitedCollectionInfoCardItem = {
  __typename: 'LimitedCollection';
  description: string;
};

type InfoCardProps = {
  item:
    | WorkflowFragment
    | ToolFragment
    | CollectionInfoCardItem
    | LimitedCollectionInfoCardItem;
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
};

function InfoCardPopover({ item, onOpenChange, isOpen }: InfoCardProps) {
  const enterRegion = useHotkeyRegion();
  useEffect(() => {
    if (isOpen) {
      return enterRegion();
    }
  }, [isOpen, enterRegion]);

  const isCollection =
    item.__typename === 'Collection' || item.__typename === 'LimitedCollection';

  let itemName: string;
  if (isCollection) {
    itemName = 'collection';
  } else if (isWorkflow(item)) {
    itemName = 'playbook';
  } else if (isTool(item)) {
    itemName = 'snippet';
  } else {
    // Should never happen
    throw new Error(`Unpexected item type: ${item}`);
  }

  return (
    <PopoverPrimitive.Root
      modal={true}
      open={isOpen}
      onOpenChange={(isOpen) => {
        trackEvent({
          category: `${itemName}.info_card`,
          action: isOpen ? 'open' : 'close',
        });
        onOpenChange(isOpen);
      }}
    >
      <PopoverAnchor />
      <Overlay isOpen={isOpen} />
      <Tooltip placement="left" overlay={`More info about ${itemName}`}>
        <PopoverTrigger>
          <FontAwesomeIcon icon={faInfoCircle} size="sm" />
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent sideOffset={HEADER_HEIGHT_PX}>
        {item.description && (
          <section>
            <div className="header">
              <h2>{`About this ${itemName}`}</h2>
            </div>
            <div className="contents">
              <p>{item.description}</p>
            </div>
          </section>
        )}

        {!isCollection && <HistorySection item={item} />}

        <PopoverClose>
          <FontAwesomeIcon icon={faChevronUp} size="lg" />
        </PopoverClose>
      </PopoverContent>
    </PopoverPrimitive.Root>
  );
}

export default InfoCardPopover;
