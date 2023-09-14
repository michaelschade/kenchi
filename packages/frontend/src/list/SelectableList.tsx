import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { css } from '@emotion/react';
import { faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { captureMessage } from '@sentry/react';
import classNames from 'classnames/bind';

import useHotkey from '@kenchi/ui/lib/useHotkey';

import { randomString } from '../utils';

const listItemWrapper = css`
  position: relative;
  display: inline-block;
  width: 100%;
`;

const previewCarrot = css`
  position: absolute;
  color: #8aa7c5;
  left: -10px;

  &.baseline {
    top: 0;
  }

  &.top {
    top: 7px;
  }

  &.top-header {
    top: 3px;
  }

  &.top-preview-tile {
    top: 7px;
  }

  &.center {
    top: 50%;
    transform: translateY(-50%);
  }
`;

export type SelectableListRef = {
  resetSelection: () => void;
  down: () => void;
  up: () => void;
  action: (pressedKey: string) => void;
};

export type SelectableListActionConfig<TItemRef> = {
  key: string;
  action: keyof TItemRef;
};

type SelectableListItemContext = {
  selected: boolean;
  select: () => void;
  unselect: () => void;
};
export function useSelectableListItemContext(): SelectableListItemContext {
  const context = useContext(SelectableListItemProvider);
  if (context === null) {
    throw new Error(
      'Cannot useSelected without a surrounding SelectableListItem'
    );
  }
  return context;
}

// Takes an object and returns the subset as callable.
type Callable<T> = {
  [P in keyof T]: P extends () => void ? P : never;
};

type SelectableListContext<TItemRef> = {
  itemClassName: string;
  selectedDiv: HTMLDivElement | null;
  mapDivToRef: (
    el: HTMLDivElement,
    ref: React.RefObject<Callable<TItemRef>>
  ) => void;
  setSelectedDiv: (el: HTMLDivElement | null) => void;
  resetSelection: () => void;
  runNextItem: (action: string) => void; // Super one-off hack for SearchBox
};
export function useSelectableListContext<
  TItemRef
>(): SelectableListContext<TItemRef> {
  const context = useContext(SelectableListProvider);
  if (!context) {
    throw new Error(
      'Cannot use a SelectableListItem item without a surrounding SelectableList'
    );
  }
  return context;
}

const SelectableListItemProvider =
  createContext<SelectableListItemContext | null>(null);

// We have to resolve the generic (this the <{}>), so we cast it in the
// SelectableList to the right generic.
const SelectableListProvider = createContext<SelectableListContext<{}> | null>(
  null
);

export enum IndicatorPositionEnum {
  baseline = 'baseline',
  top = 'top',
  topPreviewTile = 'top-preview-tile',
  topHeader = 'top-header',
  center = 'center',
}

type SelectableListItemProps<TItemRef> = {
  indicatorPosition?: IndicatorPositionEnum;
  scrollIntoView?: boolean;
  children:
    | ((ref: React.RefObject<TItemRef>) => React.ReactNode)
    | React.ReactNode;
};
export const SelectableListItem = <TItemRef extends {}>({
  indicatorPosition = IndicatorPositionEnum.top,
  scrollIntoView = true,
  children,
}: SelectableListItemProps<TItemRef>) => {
  const { itemClassName, selectedDiv, setSelectedDiv, mapDivToRef } =
    useSelectableListContext();
  const ref = useRef<TItemRef>(null);
  const divRef = useRef<HTMLDivElement | null>(null);

  // We do our own ref handling because we need to pass the ref back to
  // mapDivToRef, but we don't want to use useState because it'd trigger a
  // rerender, which slows down the page. Manually manage our own useRef.
  const divRefHandler = useCallback(
    (newDivRef) => {
      divRef.current = newDivRef;
      if (newDivRef) {
        mapDivToRef(newDivRef, ref);
      }
    },
    [mapDivToRef]
  );

  const setSelected = useCallback(() => {
    if (divRef.current) {
      setSelectedDiv(divRef.current);
    }
  }, [setSelectedDiv, divRef]);

  const renderedChildren = useMemo(() => {
    if (typeof children === 'function') {
      return children(ref);
    } else {
      return children;
    }
  }, [children, ref]);

  const selected = divRef.current ? selectedDiv === divRef.current : false;
  const listItemContext: SelectableListItemContext = useMemo(
    () => ({
      selected,
      select: setSelected,
      unselect: () => setSelectedDiv(null),
    }),
    [selected, setSelected, setSelectedDiv]
  );

  return (
    <div
      ref={divRefHandler}
      className={classNames(itemClassName, {
        'selectable-selected': selected,
        'selectable-scrollIntoView': scrollIntoView,
      })}
      css={listItemWrapper}
    >
      {selected && (
        <FontAwesomeIcon
          icon={faCaretRight}
          css={previewCarrot}
          className={indicatorPosition}
        />
      )}
      <SelectableListItemProvider.Provider value={listItemContext}>
        {renderedChildren}
      </SelectableListItemProvider.Provider>
    </div>
  );
};

type SelectableListProps<TItemRef> = {
  actionKeys: SelectableListActionConfig<TItemRef>[];
  children: React.ReactNode;
  scrollable?: boolean;
  scrollOffset?: number;
};

// forwardRef collapses generics (i.e. it always resolves TItemRef to {}) so
// we need to cast it (see end of line). For more details:
//   https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
//   https://github.com/DefinitelyTyped/DefinitelyTyped/issues/35834#issuecomment-497603615
export const SelectableList = forwardRef(
  <TItemRef extends {}>(
    {
      actionKeys,
      scrollable = false,
      children,
      scrollOffset,
    }: SelectableListProps<TItemRef>,
    ref: React.Ref<SelectableListRef>
  ) => {
    // This is all mostly about building up a context in a way that we won't trigger a ton of rerenders
    // (i.e. we use constant memory refs for most things)
    const [divToRef] = useState(
      () => new WeakMap<HTMLDivElement, React.RefObject<Callable<TItemRef>>>()
    );
    const [domElementsAtSelect, setDocumentElementsAtSelect] = useState<
      HTMLDivElement[]
    >([]);
    const initialized = useRef(false);
    const itemClassName = useRef(`selectableListItem-${randomString(10)}`);
    const [domElements] = useState(
      () =>
        document.getElementsByClassName(
          itemClassName.current
        ) as HTMLCollectionOf<HTMLDivElement>
    );
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedDiv, updateSelectedDiv] = useState<HTMLDivElement | null>(
      null
    );

    const updateSelectedIndex = useCallback(
      (i: number) => {
        if (i === -1) {
          updateSelectedDiv(null);
          setSelectedIndex(-1);
          return;
        }
        const el = domElements[i];
        if (!el) {
          return;
        }
        updateSelectedDiv(el);
        if (el.classList.contains('selectable-scrollIntoView')) {
          // scrollIntoView doesn't account for position: sticky on top of it, so manually reimplement
          const elRect = el.getBoundingClientRect();
          if (elRect.top < 0 && scrollOffset) {
            const y = elRect.top + window.scrollY - scrollOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          } else {
            el.scrollIntoView({ block: 'nearest' });
          }
        }
        setSelectedIndex(i);
        setDocumentElementsAtSelect([...domElements]);
      },
      [domElements, scrollOffset]
    ); // Never changes

    const mapDivToRef = useCallback(
      (el: HTMLDivElement, ref: React.RefObject<Callable<TItemRef>>) => {
        divToRef.set(el, ref);
        if (!initialized.current) {
          initialized.current = true;
          updateSelectedIndex(0);
        }
      },
      [divToRef, updateSelectedIndex]
    ); // Never changes

    const setSelectedDiv = useCallback(
      (el: HTMLDivElement | null) => {
        if (el === null) {
          updateSelectedIndex(-1);
        } else {
          for (var i = 0; i < domElements.length; i++) {
            if (domElements[i] === el) {
              updateSelectedIndex(i);
            }
          }
        }
      },
      [domElements, updateSelectedIndex]
    ); // Never changes

    const resetSelection = useCallback(() => {
      updateSelectedIndex(0);
      if (scrollable) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, [updateSelectedIndex, scrollable]);

    // Hack for SearchBox
    const runNextItem = useCallback(
      (action: string) => {
        if (selectedIndex < domElements.length - 1) {
          const elem = domElements[selectedIndex + 1];
          const ref = divToRef.get(elem as HTMLDivElement);
          if (!ref || !ref.current) {
            captureMessage('Cannot find element');
            return;
          }
          (ref.current as any)[action]?.();
        }
      },
      [selectedIndex, domElements, divToRef]
    );

    const listContext = useMemo<SelectableListContext<TItemRef>>(
      () => ({
        itemClassName: itemClassName.current,
        selectedDiv,
        mapDivToRef,
        setSelectedDiv,
        resetSelection,
        runNextItem,
      }),
      [
        itemClassName,
        selectedDiv,
        mapDivToRef,
        setSelectedDiv,
        resetSelection,
        runNextItem,
      ]
    );

    const down = useCallback(() => {
      if (selectedIndex < domElements.length - 1) {
        updateSelectedIndex(selectedIndex + 1);
        return true;
      }
      return false;
    }, [selectedIndex, domElements, updateSelectedIndex]);

    const up = useCallback(() => {
      if (selectedIndex > 0) {
        updateSelectedIndex(selectedIndex - 1);
        return true;
      }
      return false;
    }, [selectedIndex, updateSelectedIndex]);

    const action = useCallback(
      (pressedKey: string) => {
        const action = actionKeys.find(({ key }) => key === pressedKey);
        if (action && selectedIndex < domElements.length) {
          const elem = domElements[selectedIndex];
          const ref = divToRef.get(elem as HTMLDivElement);
          if (!ref || !ref.current) {
            captureMessage('Cannot find element');
          } else {
            ref.current[action.action]?.();
            return true;
          }
        }
        return false;
      },
      [actionKeys, selectedIndex, domElements, divToRef]
    );

    useImperativeHandle(
      ref,
      () => ({
        resetSelection,
        down,
        up,
        action,
      }),
      [resetSelection, down, up, action]
    );

    useHotkey(
      'ArrowUp',
      useCallback((e) => up() && e.preventDefault(), [up])
    );

    useHotkey(
      'ArrowDown',
      useCallback((e) => down() && e.preventDefault(), [down])
    );

    useHotkey(
      useMemo(() => actionKeys.map(({ key }) => key), [actionKeys]),
      useCallback(
        (e, key) => {
          // I don't remember why we have this special case...
          if (selectedIndex === -1) {
            if (key === 'Enter') {
              updateSelectedIndex(0);
            }
            return;
          }
          if (action(key)) {
            e.preventDefault();
          }
        },
        [selectedIndex, updateSelectedIndex, action]
      )
    );

    if (domElements.length < selectedIndex) {
      updateSelectedIndex(Math.max(0, domElements.length - 1));
    }

    // If the selected item is unmounted, move our selection to the nearest
    // previous node that's still mounted.
    if (selectedDiv && !selectedDiv.parentNode) {
      for (var i = selectedIndex - 1; i >= 0; i--) {
        if (domElementsAtSelect[i]?.parentNode) {
          updateSelectedIndex(i);
          break;
        }
      }
    }

    // Here's where we cast React.Provider<ListDetails<{}>> back to the generic.
    const Provider = SelectableListProvider.Provider as React.Provider<
      SelectableListContext<TItemRef>
    >;
    return <Provider value={listContext}>{children}</Provider>;
  }
) as unknown as <TItemRef extends {}>(
  props: SelectableListProps<TItemRef> & { ref?: React.Ref<SelectableListRef> }
) => React.ReactElement;
