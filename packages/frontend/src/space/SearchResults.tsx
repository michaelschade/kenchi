import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { css } from '@emotion/react';
import { faArrowCircleRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames/bind';
import isEqual from 'fast-deep-equal';

import { BaseColors, KenchiTheme } from '@kenchi/ui/lib/Colors';
import Loading from '@kenchi/ui/lib/Loading';

import ErrorAlert from '../components/ErrorAlert';
import Feedback from '../components/Feedback';
import { InlineSelect } from '../components/InlineSelect';
import ListItem from '../list/ListItem';
import {
  IndicatorPositionEnum,
  SelectableListItem,
  useSelectableListItemContext,
} from '../list/SelectableList';
import { PreviewRef } from '../previewTile/PreviewTile';
import { ObjectTypeEnum } from '../search/filter';
import { useSearch } from '../search/useSearch';
import { useSimpleQueryParams } from '../utils/useQueryParams';

const style = ({ colors }: KenchiTheme) => css`
  h2 {
    margin-bottom: 10px;
  }

  .search-results-header {
    color: ${colors.gray[11]};
    margin-bottom: 0.5em;
  }
`;

const feedbackStyle = css`
  display: grid;
  gap: 0.25rem;
  grid-template-columns: min-content 1fr;

  font-size: 0.8em;
  font-weight: 400;
  line-height: 1.4;
  color: hsl(208deg 7% 46%);

  &,
  & svg {
    transition: color 0.2s ease-in-out, opacity 0.2s ease-in-out,
      transform 0.2s ease-in-out;
  }

  .icon svg {
    display: block;
    margin-top: 0.25em;
    width: 0.85em;
    color: ${BaseColors.secondary};
  }

  .action-icon {
    color: ${BaseColors.info};
    margin-bottom: 0.1em;
    font-size: 0.8em;
    transform: scale(0);
    opacity: 0;
  }

  &.show-action-icon {
    cursor: pointer;

    & .action-icon {
      transform: scale(1);
      opacity: 1;
    }
  }

  &.selected {
    color: initial;
    color: hsl(208deg 10% 35%);
  }
`;

const SearchFeedback = forwardRef(({}, ref: React.Ref<PreviewRef>) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const { selected } = useSelectableListItemContext();

  useImperativeHandle(
    ref,
    () => ({
      exec: () => setShowFeedback(true),
      open: () => setShowFeedback(true),
      edit: () => {},
    }),
    []
  );

  return (
    <div style={{ marginBottom: '15px' }}>
      <div
        css={feedbackStyle}
        onClick={() => setShowFeedback(true)}
        className={classNames({
          selected,
          'show-action-icon': selected && !showFeedback,
        })}
      >
        <span className="icon">{svgSearchFeedback}</span>
        <span>
          <strong>Can't find what you're looking for?</strong> We'd love your
          feedback to improve search.{' '}
          <FontAwesomeIcon className="action-icon" icon={faArrowCircleRight} />
        </span>
      </div>
      {showFeedback && (
        <Feedback
          focused={selected}
          prompts={['What could be better?', "I'm looking for…"]}
          theme="light"
        />
      )}
    </div>
  );
});

export enum SubsetType {
  space = 1,
  collection = 2,
}

const searchAllToggleOptions: Record<
  SubsetType,
  { value: string; label: string }[]
> = {
  [SubsetType.space]: [
    { label: 'in this space', value: '' },
    { label: 'everywhere', value: 'true' },
  ],
  [SubsetType.collection]: [
    { label: 'in this collection', value: '' },
    { label: 'everywhere', value: 'true' },
  ],
};

function SearchResults({
  collectionIds,
  subsetType,
}: {
  collectionIds?: string[];
  subsetType?: SubsetType;
}) {
  const [{ searchAll }, setQueryParams] = useSimpleQueryParams();

  const setSearchAll = (value: string) =>
    setQueryParams({
      searchAll: value ? 'true' : undefined,
    });
  const { shortcutResult, searchResults, loading, error, setFilters } =
    useSearch();

  const prevCollectionIds = useRef<string[]>();
  useEffect(() => {
    const newCollectionIds = searchAll ? undefined : collectionIds;
    if (!isEqual(prevCollectionIds.current, newCollectionIds)) {
      setFilters({
        collectionIds: newCollectionIds,
        // If we're on a collection page, don't include collections in search results
        type:
          subsetType === SubsetType.collection
            ? [ObjectTypeEnum.playbook, ObjectTypeEnum.snippet]
            : undefined,
      });
      prevCollectionIds.current = newCollectionIds;
    }
  }, [collectionIds, searchAll, setFilters, subsetType]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorAlert title="Error loading list" error={error} />;
  }

  const feedback = (
    <SelectableListItem<PreviewRef>
      key="feedback"
      indicatorPosition={IndicatorPositionEnum.baseline}
    >
      {(ref) => <SearchFeedback ref={ref} />}
    </SelectableListItem>
  );

  return (
    <div css={style}>
      {shortcutResult && (
        <>
          <div className="search-results-header">Shortcut</div>
          <ListItem item={shortcutResult} analyticsSource="shortcuts" />
        </>
      )}
      {(searchResults.length || !shortcutResult) && (
        <div className="search-results-header">
          Search results{' '}
          {subsetType ? (
            <InlineSelect
              options={searchAllToggleOptions[subsetType]}
              value={searchAll || ''}
              onChange={(value) => setSearchAll(value)}
            />
          ) : null}
        </div>
      )}
      {searchResults.length === 0 && !shortcutResult && (
        <>
          <p className="text-muted">None found :(</p>
          {feedback}
        </>
      )}
      {searchResults.map((wt, i) => {
        const showFeedback =
          i === 2 ||
          (searchResults.length <= 2 && i === searchResults.length - 1);
        return [
          <ListItem
            key={wt.id}
            item={wt}
            analyticsSource="search"
            searchIndex={i}
            showTags={true}
          />,
          showFeedback ? feedback : null,
        ];
      })}
    </div>
  );
}

export default memo(SearchResults);

const svgSearchFeedback = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 448" fill="none">
    <path
      xmlns="http://www.w3.org/2000/svg"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 208C0 93.1 114.6 0 256 0C397.4 0 512 93.1 512 208C512 322.9 397.4 416 256 416C217.6 416 181.3 408.9 148.6 396.6C124 416.2 74.3 448 8 448C4.8 448 2 446.2 0.7 443.2C-0.6 440.2 0 436.8 2.2 434.5C2.7 434 44.5 389.1 57 338.7C21.4 303 0 257.6 0 208ZM325.498 248.727L369.899 293.121C374.041 297.306 374.041 304.074 369.855 308.26L357.251 320.861C353.11 325.046 346.341 325.046 342.154 320.861L297.753 276.468C295.749 274.464 294.636 271.748 294.636 268.898V261.64C278.915 273.93 259.142 281.232 237.632 281.232C186.462 281.232 145 239.777 145 188.616C145 137.455 186.462 96 237.632 96C288.802 96 330.264 137.455 330.264 188.616C330.264 210.122 322.96 229.892 310.668 245.61H317.927C320.778 245.61 323.494 246.724 325.498 248.727ZM180.628 188.616C180.628 220.141 206.146 245.61 237.632 245.61C269.162 245.61 294.636 220.096 294.636 188.616C294.636 157.091 269.118 131.622 237.632 131.622C206.101 131.622 180.628 157.135 180.628 188.616Z"
      fill="currentColor"
    />
  </svg>
);
