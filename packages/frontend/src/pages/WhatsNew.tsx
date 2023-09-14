import { useEffect, useMemo, useState } from 'react';

import { css } from '@emotion/react';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons';
import { DateTime } from 'luxon';
import { Link, useHistory } from 'react-router-dom';

import { SlateNode } from '@kenchi/slate-tools/lib/types';
import {
  HeaderBar,
  HeaderIconLink,
  SectionHeader,
} from '@kenchi/ui/lib/Headers';
import { ContentContainer } from '@kenchi/ui/lib/Layout';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { linkStyle } from '@kenchi/ui/lib/Text';

import ErrorAlert from '../components/ErrorAlert';
import Pagination from '../components/Pagination';
import {
  MajorChangesQuery,
  MajorChangesQueryVariables,
  NotificationsQuery,
  NotificationTypeEnum,
} from '../graphql/generated';
import { useMajorChanges } from '../graphql/useChanges';
import { useMarkNotifications } from '../notifications/useMarkNotifications';
import { useNotifications } from '../notifications/useNotifications';
import { PreviewRenderer } from '../slate/Renderer';
import { pastDateString } from '../utils/time';

type User = NonNullable<MajorChangesQuery['viewer']['user']>;

type ProductChangeNode =
  MajorChangesQuery['viewer']['productChanges']['edges'][number]['node'];
type ToolChangeNode = User['majorToolChanges']['edges'][number]['node'];
type WorkflowChangeNode = User['majorWorkflowChanges']['edges'][number]['node'];
type MajorChangeItem = ProductChangeNode | ToolChangeNode | WorkflowChangeNode;

type WithMoment<T> = T & { createdAtMoment: DateTime };

const listContainerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const changeStyle = css`
  border-radius: 5px;
  white-space: break-spaces;
  word-break: break-word;
  background: linear-gradient(254.31deg, #ffffff 1.15%, #fafcff 99.83%);
  box-shadow: 0px 0px 10px hsla(0deg, 0%, 57%, 10%);
  border: 1px solid #ebf3ff;
  padding: 10px;

  h2 {
    margin: 0;
    margin-bottom: 3px;
    font-size: 0.9em;
    font-weight: 600;
    line-height: 1.3em;

    a:not(:hover) {
      color: unset;
      text-decoration: none;
    }
  }

  .content {
    font-size: 0.9em;
    font-weight: 300;
    overflow-wrap: break-word;
  }
`;

const metadataStyle = css`
  display: flex;
  gap: 5px;
  padding: 0;
  margin: 0;
  margin-bottom: 5px;
  font-size: 0.9em;

  align-items: center;
  line-height: 1.1em;

  li {
    display: inline-block;
    margin: 0;
    padding: 0;

    color: #7e8990;
    font-size: 0.8em;
    line-height: 1.1em;
  }

  .label {
    display: inline-block;
    user-select: none;
    font-size: 0.7em;
    border-radius: 0.5rem;
    padding: 1px 6px;
    font-weight: 600;
    color: #fff;
    vertical-align: text-top;

    background-color: hsla(207, 25%, 55%, 0.75);

    &.category-kenchi {
      background-color: hsla(249, 20%, 55%, 0.65);
    }

    &.unread {
      background-color: hsla(207, 75%, 50%, 0.85);

      &.category-kenchi {
        background-color: hsla(249, 45%, 55%, 0.75);
      }
    }
  }
`;

type ChangeType = {
  title: string;
  description?: SlateNode[] | null;
  category: string;
  categoryLabel?: string;
  createdAt: DateTime;
  linkTo?: string;
  unread: boolean;
};

function Change({
  title,
  description,
  category,
  categoryLabel,
  createdAt,
  linkTo,
  unread,
}: ChangeType) {
  return (
    <div css={changeStyle}>
      <ul css={metadataStyle}>
        <li>
          <span
            className={`label category-${category} ${unread ? 'unread' : ''}`}
          >
            {categoryLabel || category}
          </span>
        </li>
        <li>{pastDateString(createdAt)}</li>
      </ul>
      <h2 className={linkTo && 'link'}>
        {linkTo ? (
          <Link
            css={(theme) => linkStyle(theme, { underline: false })}
            to={linkTo}
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </h2>

      {description && (
        <div className="content">
          <PreviewRenderer contents={description} maxLength={440} />
        </div>
      )}
    </div>
  );
}

function ProductChange({
  change,
  unviewed,
}: {
  change: WithMoment<ProductChangeNode>;
  unviewed: boolean;
}) {
  return (
    <Change
      title={change.title}
      description={change.description}
      category="kenchi"
      categoryLabel="kenchi"
      createdAt={change.createdAtMoment}
      linkTo={`/whats-new/${change.id}`}
      unread={unviewed}
    />
  );
}

function ItemChange({
  change,
  unviewed,
  itemType,
}: {
  change: WithMoment<ToolChangeNode | WorkflowChangeNode>;
  unviewed: boolean;
  itemType: 'playbook' | 'snippet';
}) {
  let category;
  if (change.isArchived) {
    category = 'archived';
  } else if (change.isFirst) {
    category = 'new';
  } else {
    category = 'updated';
  }
  const categoryLabel = `${category} ${itemType}`;
  const linkTo = `/${itemType}s/${change.staticId}`;

  let description: SlateNode[] | null;
  if (change.isFirst && change.description) {
    description = [
      { type: 'paragraph', children: [{ text: change.description }] },
    ];
  } else {
    description = change.majorChangeDescription;
  }

  return (
    <Change
      title={change.name}
      description={description}
      category={category}
      categoryLabel={categoryLabel}
      createdAt={change.createdAtMoment}
      linkTo={linkTo}
      unread={unviewed}
    />
  );
}

type Notifications = NonNullable<
  NotificationsQuery['viewer']['user']
>['notifications'];
function WhatsNew({
  changes,
  unviewedNotifications,
}: {
  changes: WithMoment<MajorChangeItem>[];
  unviewedNotifications?: Notifications | null;
}) {
  const [unviewedChangesSet, setUnviewedChangesSet] =
    useState<Set<string> | null>(null);
  // We want to save unviewedChangesSet on initial unviewedNotifications so it stays the same while on the page
  useEffect(() => {
    if (!unviewedNotifications || unviewedChangesSet) {
      return;
    }
    const set = new Set<string>(
      unviewedNotifications.edges
        .map((e) => e.node.notification.relatedNode?.id)
        .filter((id) => id) as string[]
    );
    setUnviewedChangesSet(set);
  }, [unviewedNotifications, unviewedChangesSet]);

  const makeChange = (change: WithMoment<MajorChangeItem>) => {
    switch (change.__typename) {
      case 'ProductChange':
        return (
          <ProductChange
            key={change.id}
            change={change}
            unviewed={unviewedChangesSet?.has(change.id) || false}
          />
        );
      case 'WorkflowRevision':
        return (
          <ItemChange
            key={change.id}
            change={change}
            unviewed={unviewedChangesSet?.has(change.id) || false}
            itemType="playbook"
          />
        );
      case 'ToolRevision':
        return (
          <ItemChange
            key={change.id}
            change={change}
            unviewed={unviewedChangesSet?.has(change.id) || false}
            itemType="snippet"
          />
        );
    }
  };

  return <>{changes.map(makeChange)}</>;
}

const LIMIT = 10;
export default function WhatsNewPage() {
  const [prevStack, setPrevStack] = useState<MajorChangesQueryVariables[]>([
    { productFirst: LIMIT, toolFirst: LIMIT, workflowFirst: LIMIT },
  ]);
  const changeVariables = prevStack[prevStack.length - 1];

  const history = useHistory();

  // TODO: figure out solution for the "100" problem
  const { data: unviewedNotifications } = useNotifications(
    { active: true, first: 100 },
    'network-only'
  );
  const {
    data: changes,
    loading: changesLoading,
    error: changesError,
  } = useMajorChanges(changeVariables, 'cache-and-network');

  const [markNotifications, { called }] = useMarkNotifications();
  useEffect(() => {
    if (!unviewedNotifications || !changes || called) {
      return;
    }
    if (unviewedNotifications.edges.length > 0) {
      markNotifications({
        viewed: true,
        types: [
          NotificationTypeEnum.product_major_change,
          NotificationTypeEnum.tool_created,
          NotificationTypeEnum.tool_archived,
          NotificationTypeEnum.tool_major_change,
          NotificationTypeEnum.workflow_created,
          NotificationTypeEnum.workflow_archived,
          NotificationTypeEnum.workflow_major_change,
        ],
      });
    }
  }, [unviewedNotifications, markNotifications, called, changes]);

  const combinedChangeEdges = useMemo(() => {
    if (!changes) {
      return null;
    }
    const withMoment = (e: {
      cursor: string;
      node: MajorChangeItem;
    }): { cursor: string; node: WithMoment<MajorChangeItem> } => ({
      cursor: e.cursor,
      node: {
        ...e.node,
        createdAtMoment: DateTime.fromISO(e.node.createdAt),
      },
    });
    let allChanges: {
      cursor: string;
      node: WithMoment<MajorChangeItem>;
    }[] = [];
    allChanges = allChanges.concat(
      changes.productChanges.edges.map(withMoment),
      changes.majorToolChanges.edges.map(withMoment),
      changes.majorWorkflowChanges.edges.map(withMoment)
    );
    allChanges.sort((a, b) => {
      if (a.node.createdAtMoment < b.node.createdAtMoment) {
        return 1;
      } else if (a.node.createdAtMoment > b.node.createdAtMoment) {
        return -1;
      } else {
        return 0;
      }
    });
    return allChanges.slice(0, LIMIT);
  }, [changes]);

  const [lastProductCursor, lastWorkflowCursor, lastToolCursor] =
    useMemo(() => {
      if (!combinedChangeEdges) {
        return [null, null, null];
      }
      let lpc = null,
        lwc = null,
        ltc = null;
      for (var i = combinedChangeEdges.length - 1; i >= 0; i--) {
        const typename = combinedChangeEdges[i].node.__typename;
        if (typename === 'ProductChange' && !lpc) {
          lpc = combinedChangeEdges[i].cursor;
        }
        if (typename === 'WorkflowRevision' && !lwc) {
          lwc = combinedChangeEdges[i].cursor;
        }
        if (typename === 'ToolRevision' && !ltc) {
          ltc = combinedChangeEdges[i].cursor;
        }
        if (lpc && lwc && ltc) {
          break;
        }
      }
      return [lpc, lwc, ltc];
    }, [combinedChangeEdges]);

  const header = (
    <HeaderBar>
      <HeaderIconLink onClick={() => history.goBack()} icon={faArrowLeft} />
      <SectionHeader>Since you've been gone&hellip;</SectionHeader>
    </HeaderBar>
  );

  if (changesError) {
    return (
      <>
        {header}
        <ContentContainer>
          <ErrorAlert title="Error loading changes" error={changesError} />
        </ContentContainer>
      </>
    );
  }
  if (changesLoading || !combinedChangeEdges || !changes) {
    return (
      <>
        {header}
        <ContentContainer>
          <LoadingSpinner name="whats new" />
        </ContentContainer>
      </>
    );
  }

  const hasNext =
    (changes.majorWorkflowChanges.pageInfo.hasNextPage &&
      changeVariables.workflowFirst > 0) ||
    (changes.productChanges.pageInfo.hasNextPage &&
      changeVariables.productFirst > 0);
  const loadNext = () => {
    const variables: MajorChangesQueryVariables = {
      productFirst: LIMIT,
      toolFirst: LIMIT,
      workflowFirst: LIMIT,
    };
    variables.productAfter = lastProductCursor;
    variables.workflowAfter = lastWorkflowCursor;
    variables.toolAfter = lastToolCursor;
    setPrevStack((stack) => [...stack, variables]);
  };

  const hasPrev = prevStack.length > 1;
  const loadPrev = () => {
    prevStack.pop();
    setPrevStack([...prevStack]);
  };

  return (
    <>
      {header}
      <ContentContainer css={listContainerStyle}>
        <WhatsNew
          changes={combinedChangeEdges.map((e) => e.node)}
          unviewedNotifications={unviewedNotifications}
        />
        <Pagination onPrev={hasPrev && loadPrev} onNext={hasNext && loadNext} />
      </ContentContainer>
    </>
  );
}
