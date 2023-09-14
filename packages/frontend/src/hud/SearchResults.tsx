import { useCallback, useEffect, useRef } from 'react';

import { Commands } from '@kenchi/commands';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import ErrorAlert from '../components/ErrorAlert';
import { isDemoUrl } from '../demo/utils';
import {
  IndicatorPositionEnum,
  SelectableList,
  SelectableListActionConfig,
  SelectableListItem,
  SelectableListRef,
} from '../list/SelectableList';
import { ListItemType } from '../list/useList';
import { usePageUrl } from '../pageContext/pageUrl/usePageUrl';
import { PreviewRef } from '../previewTile/PreviewTile';
import { ObjectTypeEnum } from '../search/filter';
import { useSearch } from '../search/useSearch';
import Tool from '../tool/Tool';
import useMessageRouter from '../utils/useMessageRouter';
import { isTool } from '../utils/versionedNode';
import { recomputeHeight } from './utils';

export const ACTION_KEYS: SelectableListActionConfig<PreviewRef>[] = [
  {
    key: 'Enter',
    action: 'exec',
  },
  {
    key: 'shift+Enter',
    action: 'open',
  },
];

type ResultItemProps = {
  item: ListItemType;
  isLast: boolean;
  searchIndex?: number;
};
const ResultItem = ({ item, isLast, searchIndex }: ResultItemProps) => {
  const router = useMessageRouter<'hud'>();
  const prepareRun = useCallback(() => {
    return router.sendCommand('pageScript', 'hud:prepareRun');
  }, [router]);

  const maybeClose = useCallback(
    (success: boolean) => {
      if (success) {
        router.sendCommand('pageScript', 'hud:hideAfterRun');
      }
    },
    [router]
  );

  const onToggleRunModal = useCallback(() => {
    window.setTimeout(() => {
      router.sendCommand('pageScript', 'hud:updateHeight', {
        height: recomputeHeight(),
      });
    }, 10);
  }, [router]);

  return (
    <SelectableListItem<PreviewRef>
      indicatorPosition={IndicatorPositionEnum.topPreviewTile}
    >
      {(ref) => {
        if (!isTool(item)) {
          return null;
        }
        return (
          <Tool
            tool={item}
            editType={null}
            analyticsSource={
              typeof searchIndex === 'number' ? 'hud-search' : 'hud-shortcut'
            }
            searchIndex={searchIndex}
            // TODO: un-dumb this
            style={{
              marginBottom: isLast ? '0' : '10px',
            }}
            showTags={true}
            shouldShowMenu={false}
            shouldShowDashboardLink={true}
            ref={ref}
            onToggleRunModal={onToggleRunModal}
            onBeforeRun={prepareRun}
            onRun={maybeClose}
          />
        );
      }}
    </SelectableListItem>
  );
};

export default function SearchResults({
  collectionIds,
}: {
  collectionIds: string[];
}) {
  const {
    searchResults,
    shortcutResult,
    loading,
    error,
    suggestSync,
    searchInputValue,
    setSearchInputValue,
    setFilters,
    setHitsPerPage,
  } = useSearch();
  const router = useMessageRouter<'hud'>();
  const selectableListRef = useRef<SelectableListRef>(null);
  const pageUrl = usePageUrl();
  const isDemo = pageUrl && isDemoUrl(pageUrl);

  useEffect(() => {
    setHitsPerPage(3);
    setFilters({
      collectionIds: collectionIds,
      type: ObjectTypeEnum.snippet,
      shouldOnlyIncludeDemoCollection: isDemo ? true : undefined,
    });
  }, [isDemo, collectionIds, setFilters, setHitsPerPage]);

  useEffect(() => {
    const updateSearch = ({ value }: { value: string | null }) => {
      setSearchInputValue(value || '');
      return Promise.resolve();
    };
    router.addCommandHandler('pageScript', 'updateSearch', updateSearch);
    return () => {
      router.removeCommandHandler('pageScript', 'updateSearch', updateSearch);
    };
  }, [setSearchInputValue, router]);

  useEffect(() => {
    const handleKeyPress = ({
      key,
      shiftKey,
    }: Commands['hud']['keyPress']['args']) => {
      switch (key) {
        case 'Escape':
          router.sendCommand('pageScript', 'hud:hide');
          break;
        case 'ArrowDown':
          selectableListRef.current?.down();
          break;
        case 'ArrowUp':
          selectableListRef.current?.up();
          break;
        case 'Enter':
          selectableListRef.current?.action(shiftKey ? 'shift+Enter' : 'Enter');
          break;
      }
      return Promise.resolve();
    };
    router.addCommandHandler('pageScript', 'keyPress', handleKeyPress);
    return () => {
      router.removeCommandHandler('pageScript', 'keyPress', handleKeyPress);
    };
  }, [router]);

  // Every time the search value changes consider syncing our data. That way the
  // hidden iframes across sites aren't constantly issuing HTTP requests, and
  // even if you have an outdated value when you search the worst case is the
  // correct value will pop in after a second when the network response comes
  // in.
  useEffect(() => {
    suggestSync();
  }, [searchInputValue, suggestSync]);

  useEffect(() => {
    selectableListRef.current?.resetSelection();

    router.sendCommand('pageScript', 'hud:updateHeight', {
      height: recomputeHeight(),
    });
  }, [router, searchResults, shortcutResult]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert title="Error loading list" error={error} />;
  }

  if (shortcutResult === null && searchResults.length === 0) {
    return <p className="text-muted">No snippets found</p>;
  }

  return (
    <SelectableList<PreviewRef>
      actionKeys={ACTION_KEYS}
      ref={selectableListRef}
    >
      {shortcutResult && (
        <ResultItem item={shortcutResult} isLast={searchResults.length === 0} />
      )}

      {searchResults.map((item, i) => (
        <ResultItem
          key={item.id}
          item={item as ListItemType}
          searchIndex={i}
          isLast={i === searchResults.length - 1}
        />
      ))}
    </SelectableList>
  );
}
