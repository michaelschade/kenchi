import { useCallback, useEffect, useMemo } from 'react';

import {
  ApolloError,
  ApolloQueryResult,
  OperationVariables,
} from '@apollo/client';
import { css } from '@emotion/react';
import {
  faCheckCircle,
  faExclamationTriangle,
  faSyncAlt,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { isFailure } from '@kenchi/shared/lib/Result';
import { BaseButton } from '@kenchi/ui/lib/Button';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import {
  ExternalDataReferencesQuery,
  KenchiErrorFragment,
} from '../../../graphql/generated';
import { usePageAction } from '../../../pageContext/actions/usePageAction';
import { usePageDataController } from '../../../pageContext/pageData/usePageDataController';
import useSyncTags, { StatusOfSync } from '../../../pageContext/useSyncTags';

const unavailableStyle = css`
  opacity: 0.6;
  cursor: not-allowed;
`;

const spinnerStyle = css`
  opacity: 0.6;
  animation: fa-spin 2s linear infinite;
`;

type PropsForSyncButton = {
  appName: string;
  actionTypeForSync: 'extractIntercomTags' | 'extractZendeskTags';
  onErrorFromSync: (
    error: ApolloError | KenchiErrorFragment | JSX.Element | null
  ) => void;
  onChangeStatusOfSync: (state: StatusOfSync) => void;
  refetchTags: (
    variables?: Partial<OperationVariables> | undefined
  ) => Promise<ApolloQueryResult<ExternalDataReferencesQuery>>;
  referenceSource: 'intercom' | 'zendesk';
  existingTags: any;
};

export const SyncButton = ({
  appName,
  actionTypeForSync,
  refetchTags,
  onErrorFromSync,
  onChangeStatusOfSync,
  referenceSource,
  existingTags,
}: PropsForSyncButton) => {
  const { syncTags, statusOfSync, summaryOfSync, errorFromSync } = useSyncTags(
    referenceSource,
    refetchTags
  );
  const pageDataController = usePageDataController();
  const { runAction, error: actionError } = usePageAction(actionTypeForSync);
  const coalesceSyncState = useMemo(
    () => (actionError ? 'error' : statusOfSync),
    [actionError, statusOfSync]
  );
  const coalesceSyncError = useMemo(
    () =>
      errorFromSync ?? (actionError ? <>{actionError.error.message}</> : null),
    [actionError, errorFromSync]
  );

  useEffect(() => {
    onErrorFromSync(coalesceSyncError);
  }, [coalesceSyncError, onErrorFromSync]);

  useEffect(() => {
    onChangeStatusOfSync(coalesceSyncState);
  }, [coalesceSyncState, onChangeStatusOfSync]);

  const displayForSyncState = useMemo(() => {
    let successTooltip = `Your ${appName} tags are up to date`;
    const createdStat = summaryOfSync?.created || 0;
    const updatedStat = summaryOfSync?.updated || 0;
    if (createdStat + updatedStat > 0) {
      successTooltip += `. We found ${summaryOfSync?.total} total tags, `;
      successTooltip += `${createdStat} of which ${
        createdStat === 1 ? 'was' : 'were'
      } new`;
      if (updatedStat) {
        successTooltip += ` and ${updatedStat} ${
          updatedStat === 1 ? 'was' : 'were'
        } renamed`;
      }
      successTooltip += '.';
    }
    return {
      new: {
        icon: faSyncAlt,
        tooltip: `Refresh tags from ${appName}`,
      },
      syncing: {
        icon: faSyncAlt,
        tooltip: `Refreshing tags from ${appName}`,
      },
      error: {
        icon: faExclamationTriangle,
        tooltip: `Error refreshing tags from ${appName}`,
      },
      complete: {
        icon: faCheckCircle,
        tooltip: successTooltip,
      },
    };
  }, [
    appName,
    summaryOfSync?.created,
    summaryOfSync?.total,
    summaryOfSync?.updated,
  ]);

  const sync = useCallback(async () => {
    const extractTagsResult = await runAction();
    if (isFailure(extractTagsResult)) {
      return;
    }

    syncTags(existingTags, extractTagsResult.data);
  }, [existingTags, runAction, syncTags]);

  if (pageDataController.supportedActions().includes(actionTypeForSync)) {
    return (
      <Tooltip
        mouseEnterDelay={0}
        placement="left"
        overlay={displayForSyncState[coalesceSyncState].tooltip}
      >
        <BaseButton
          css={({ colors }: KenchiTheme) => css`
            padding: 0;
            color: ${colors.gray[10]};
            &:hover,
            &:focus {
              color: ${colors.gray[12]};
            }
          `}
          onClick={sync}
          disabled={coalesceSyncState === 'syncing'}
        >
          <FontAwesomeIcon
            css={coalesceSyncState === 'syncing' ? spinnerStyle : null}
            icon={displayForSyncState[coalesceSyncState].icon}
          />
        </BaseButton>
      </Tooltip>
    );
  } else {
    return (
      <Tooltip
        mouseEnterDelay={0}
        placement="left"
        overlay={`Open Kenchi inside of ${appName} to refresh tag list`}
      >
        <FontAwesomeIcon css={unavailableStyle} icon={faSyncAlt} />
      </Tooltip>
    );
  }
};
