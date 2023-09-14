import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { css } from '@emotion/react';
import { faSearch } from '@fortawesome/pro-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { Input } from '@kenchi/ui/lib/Form';
import useHotkey from '@kenchi/ui/lib/useHotkey';

import {
  IndicatorPositionEnum,
  SelectableListItem,
  useSelectableListContext,
  useSelectableListItemContext,
} from '../list/SelectableList';
import { useSidebarController } from '../pageContext/sidebar/useSidebarController';
import { DEBOUNCE_FOR_SET_SEARCH_QUERY_PARAM_MS } from '../search/constants';
import { useSearch } from '../search/useSearch';
import { isExtension } from '../utils';
import { useSimpleQueryParams } from '../utils/useQueryParams';

const stickyContainerStyles = ({ colors }: KenchiTheme) => css`
  position: sticky;
  top: -1px;
  /* use negative margins to offset container padding */
  margin: -10px -15px 5px;
  padding: 10px 15px 10px;

  &.stuck {
    z-index: 1;
    background: ${colors.accent[1]};
    box-shadow: 0px 0px 7px -2px hsla(210, 3%, 31%, 0.3),
      0 1px 1px 0 rgba(0, 0, 0, 0.05);
    transition: box-shadow 250ms ease-in;
  }
`;

const focusAfterVisible = (elem: HTMLElement) => {
  // Waiting shenanigans are for https://github.com/facebook/react/issues/14536
  if (elem.getClientRects().length === 0) {
    const timer = window.setInterval(() => {
      if (elem.getClientRects().length !== 0) {
        window.clearInterval(timer);
        elem.focus();
      }
    }, 50);
  } else {
    elem.focus();
  }
};

function SearchBox() {
  const history = useHistory();
  const { searchInputValue, setSearchInputValue } = useSearch();
  const [{ search: searchQueryParam }, setQueryParams] = useSimpleQueryParams();

  // We debounce updating the search query param so partial search terms don't
  // pollute the URL.
  const debouncedSetSearchQueryParam = useDebouncedCallback(
    (newSearchQueryParam: string) => {
      setQueryParams(
        { search: newSearchQueryParam || undefined },
        { shouldReplaceState: true }
      );
    },
    DEBOUNCE_FOR_SET_SEARCH_QUERY_PARAM_MS
  );

  useEffect(() => {
    debouncedSetSearchQueryParam(searchInputValue);
    // Normally updating the URL will cause a scroll to the top, but since we're
    // debouncing it let's force a scroll
    window.scrollTo({ top: 0 });
  }, [debouncedSetSearchQueryParam, searchInputValue]);

  useEffect(
    () => () => debouncedSetSearchQueryParam.cancel(),
    [debouncedSetSearchQueryParam]
  );

  useEffect(() => {
    if ((searchQueryParam || '') !== searchInputValue) {
      setSearchInputValue(searchQueryParam || '');
    }
    // We only want to populate searchInputValue from the search query param
    // on first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { selected, select, unselect } = useSelectableListItemContext();
  const { runNextItem } = useSelectableListContext();

  const inputRef = useRef<HTMLInputElement>(null);
  // If we auto-opened we don't want to take over focus on our first render
  const shouldFocusOnFirstRender = useRef(
    !isExtension() || document.body.className.indexOf('explicitly-opened') > -1
  );
  const autoChangeFocus = useRef(false);
  const manualChangeFocus = useRef(false);
  const unselectTimeout = useRef<null | number>(null);

  useLayoutEffect(() => {
    if (manualChangeFocus.current) {
      manualChangeFocus.current = false;
      return;
    }
    if (!inputRef.current) {
      return;
    }
    autoChangeFocus.current = true;
    if (selected) {
      if (shouldFocusOnFirstRender.current) {
        focusAfterVisible(inputRef.current);
      } else {
        shouldFocusOnFirstRender.current = true;
      }
    } else {
      inputRef.current.blur();
    }
  }, [selected, inputRef]);

  const sidebarController = useSidebarController();

  useHotkey(
    'Escape',
    useCallback(() => {
      if (!selected) {
        select();
      } else if (searchInputValue.length) {
        setSearchInputValue('');
      } else if (history.length > 1) {
        history.goBack();
      } else {
        sidebarController?.hideKenchi();
      }
    }, [
      searchInputValue.length,
      selected,
      history,
      sidebarController,
      setSearchInputValue,
      select,
    ])
  );

  useHotkey(
    'n',
    useCallback(() => {
      history.push('/new');
      return false;
    }, [history])
  );

  useHotkey(
    '/',
    useCallback(
      (e) => {
        e.preventDefault();
        select();
      },
      [select]
    )
  );

  // If we were on the search box when we blur the entire iframe, don't remove
  // our selection, and refocus when the iframe is selected again.
  useEffect(() => {
    const windowFocus = () => {
      if (inputRef.current) {
        autoChangeFocus.current = true;
        inputRef.current.focus();
        inputRef.current.select();
        select();
      }
    };
    window.addEventListener('focus', windowFocus);
    window.addEventListener('kenchi:refocus', windowFocus);
    return () => {
      window.removeEventListener('focus', windowFocus);
      window.removeEventListener('kenchi:refocus', windowFocus);
    };
  }, [select]);

  const syncFocus = (e: React.FocusEvent) => {
    // If the blur is the result of our useEffect for when we're no longer
    // selected (e.g. when the user pressed an arrow key), ignore the event.
    // Otherwise do the opposite, where we tell the list to (un)select us and
    // make sure we ignore the selection state change.
    if (autoChangeFocus.current) {
      autoChangeFocus.current = false;
    } else {
      if (e.type === 'focus') {
        manualChangeFocus.current = true;
        select();
      } else {
        // Give us time to cancel this if we're blurring the whole window.
        unselectTimeout.current = window.setTimeout(() => {
          unselectTimeout.current = null;
          manualChangeFocus.current = true;
          unselect();
        }, 1);
      }
    }
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      window.setTimeout(() => {
        runNextItem(e.shiftKey ? 'open' : 'exec');
      }, 0);
    }
  };

  return (
    <Input
      type="search"
      icon={faSearch}
      ref={inputRef}
      className="hotkeys-allow-up hotkeys-allow-down"
      placeholder="Search"
      value={searchInputValue}
      onChange={(e) => {
        const newSearchQuery = e.target.value;
        setSearchInputValue(newSearchQuery);
      }}
      onKeyDown={handleEnter}
      onFocus={syncFocus}
      onBlur={syncFocus}
    />
  );
}

export const OFFSET_FOR_SCROLL = 65;

export default function SelectableSearchBox() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([event]) => {
        event.target.classList.toggle('stuck', event.intersectionRatio < 1);
      },
      { threshold: [1] }
    );
    observer.observe(ref.current);
  }, []);

  return (
    <div ref={ref} css={stickyContainerStyles}>
      <SelectableListItem
        indicatorPosition={IndicatorPositionEnum.center}
        scrollIntoView={false}
      >
        <SearchBox />
      </SelectableListItem>
    </div>
  );
}
