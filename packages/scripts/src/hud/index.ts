import { KenchiMessageRouter } from '@kenchi/commands';

import getMessageRouter from '../getMessageRouter';

const HUD_WIDTH = 300;

type OpenState = {
  anchorNode: Text | Element;
  anchorOffset: number;
  searchValue: string;
  selectedIndex: number;
  onClose: () => void;
  desiredHeight: number;
  running: boolean;
  currentOffset: number;
};
type State = {
  elem: HTMLDivElement;
  iframe: HTMLIFrameElement;
  openState: OpenState | null;
  hiddenFor: [Text | Element, number] | null;
  lastDesiredHeight?: number;
};

const setupLayout = (elem: HTMLDivElement, iframe: HTMLIFrameElement) => {
  elem.style.position = 'absolute';
  elem.style.display = 'none';
  elem.style.zIndex = '99999';
  elem.style.border = '0';
  elem.style.width = `${HUD_WIDTH}px`;
  elem.style.boxShadow =
    '0 0 1px 0 rgba(0, 0, 0, .3), 0 0 20px -5px rgba(0, 0, 0, 0.2)';
  // We don't want to import from @kenchi/ui for fear of its giant dependency
  // tree. It may be fine and would get tree-shaken out, but it's not worth it
  // as our only copy-paste from that package into scripts.
  elem.style.backgroundColor = '#fafbff';
  iframe.style.height = '100%';
  iframe.style.border = '0';
};

const getPlacementRect = (textNode: Text, offset: number) => {
  const newRange = document.createRange();

  newRange.setStart(textNode, offset);
  newRange.setEnd(textNode, offset);
  const rects = newRange.getClientRects();
  return rects[0];
};

const checkSelection = (): null | {
  searchValue: string;
  textNode: Text | null;
  hostNode: Element;
  anchorOffset: number;
  currentOffset: number;
} => {
  const selection = window.getSelection();
  // Require a collapsed selection
  if (!selection || !selection.isCollapsed) {
    return null;
  }
  const node = selection.anchorNode;
  const offset = selection.anchorOffset;
  if (!node) {
    return null;
  }

  const el = node instanceof Element ? node : node.parentElement;
  const hostNode = el?.closest('[contenteditable]');
  if (!hostNode) {
    return null;
  }

  const textContent = node.textContent || '';
  const firstSepPastOffset = /[^\w\d_-]/.exec(textContent.slice(offset));
  const endOffset = firstSepPastOffset
    ? offset + firstSepPastOffset.index
    : textContent.length;

  const value = textContent.slice(0, endOffset);
  let searchStart = value.lastIndexOf(' ;');
  if (searchStart === -1) {
    if (value.startsWith(';')) {
      const prevText = node.previousSibling?.textContent;
      if (prevText && !prevText.endsWith(' ')) {
        return null;
      }
      searchStart = 1;
    } else {
      return null;
    }
  } else {
    searchStart += 2;
  }

  let textNode = null;
  if (node instanceof Text) {
    textNode = node;
  } else {
    const childNode = node.childNodes[0];
    if (node.childNodes.length === 1 && childNode instanceof Text) {
      textNode = childNode;
    }
  }

  return {
    searchValue: value.substr(searchStart),
    textNode,
    hostNode,
    anchorOffset: searchStart,
    currentOffset: offset,
  };
};

const hudActive = () => {
  const activeElement = document.activeElement;
  return (
    activeElement?.tagName === 'IFRAME' &&
    activeElement.parentElement?.id === 'kenchi-hud'
  );
};

const initialize = (messageRouter: KenchiMessageRouter<'pageScript'>) => {
  const report = (message: string, extra?: Record<string, unknown>) => {
    messageRouter.sendCommand('contentScript', 'report', { message, extra });
  };
  const reportError = (e: unknown) => {
    let message: string;
    const extra: Record<string, unknown> = {};
    if (e instanceof Error) {
      message = e.message;
      extra.name = e.name;
      extra.stack = e.stack;
    } else {
      message = `${e}`;
      extra.details = e;
    }
    messageRouter.sendCommand('contentScript', 'report', { message, extra });
  };

  const elem = document.querySelector<HTMLDivElement>('#kenchi-hud');
  if (!elem) {
    report('HUD element not found');
    return;
  }
  const iframe = elem.querySelector<HTMLIFrameElement>('iframe');
  if (!iframe) {
    report('HUD iframe not found');
    return;
  }

  const state: State = {
    elem,
    iframe,
    openState: null,
    hiddenFor: null,
  };

  setupLayout(elem, iframe);

  const hide = ({
    explicit,
    clearSearch,
  }: {
    explicit: boolean;
    clearSearch: boolean;
  }) => {
    if (state.openState) {
      // If explicitly closed make sure we reset selection
      if (explicit && hudActive() && state.openState.anchorNode) {
        const selection = window.getSelection();
        try {
          selection?.setBaseAndExtent(
            state.openState.anchorNode,
            state.openState.currentOffset,
            state.openState.anchorNode,
            state.openState.currentOffset
          );
        } catch (e) {
          reportError(e);
        }
      }
      state.openState.onClose();
      if (explicit) {
        state.hiddenFor = [
          state.openState.anchorNode,
          state.openState.anchorOffset,
        ];
      }
      state.lastDesiredHeight = state.openState.desiredHeight;
      state.openState = null;
      if (clearSearch) {
        messageRouter.sendCommand('hud', 'updateSearch', { value: null });
      }
    }
    if (state.elem) {
      state.elem.style.display = 'none';
    }
  };

  const handleKeyDown = (rawE: Event) => {
    const e = rawE as KeyboardEvent;
    if (!state.openState) {
      return;
    }
    if (e.key === 'Enter') {
      state.openState.running = true;
    }
    if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Enter' ||
      e.key === 'Escape'
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      messageRouter.sendCommand('hud', 'keyPress', {
        key: e.key,
        shiftKey: e.shiftKey,
      });
    }
  };

  const handleKeyUp = (rawE: Event) => {
    const e = rawE as KeyboardEvent;
    if (!state.openState) {
      return;
    }
    if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Enter' ||
      e.key === 'Escape'
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };

  const place = () => {
    if (!state.openState) {
      return;
    }

    const { anchorNode, anchorOffset, desiredHeight } = state.openState;

    const searchRect =
      anchorNode instanceof Text
        ? getPlacementRect(anchorNode, anchorOffset)
        : anchorNode.getBoundingClientRect();

    const topSpace = searchRect.top;
    const bottomSpace = window.innerHeight - searchRect.bottom;

    let height, showOnTop;
    if (topSpace >= desiredHeight) {
      // the entire iframe fits within the window on top
      height = desiredHeight;
      showOnTop = true;
    } else if (bottomSpace >= desiredHeight) {
      // the entire iframe fits within the window on bottom
      height = desiredHeight;
      showOnTop = false;
    } else {
      // pick the biggest side
      height = Math.max(topSpace, bottomSpace);
      showOnTop = topSpace > bottomSpace;
    }

    state.elem.style.height = `${height}px`;

    if (showOnTop) {
      state.elem.style.top = `${searchRect.top - height + window.scrollY}px`;
    } else {
      state.elem.style.top = `${searchRect.bottom + window.scrollY}px`;
    }

    const maxLeft = window.innerWidth - HUD_WIDTH;
    const left = Math.max(Math.min(maxLeft, searchRect.left), 0);
    state.elem.style.left = `${left + window.scrollX}px`;
  };

  const handleUpdate = () => {
    if (state.openState?.running) {
      return;
    }
    const selectionState = checkSelection();
    if (selectionState === null) {
      if (!hudActive()) {
        hide({ explicit: false, clearSearch: false });
      }
      return;
    }

    const { searchValue, textNode, hostNode, anchorOffset, currentOffset } =
      selectionState;
    const anchorNode = textNode || hostNode;

    if (
      state.hiddenFor &&
      state.hiddenFor[0] === anchorNode &&
      state.hiddenFor[1] === anchorOffset
    ) {
      return;
    }

    if (
      state.openState &&
      (state.openState.anchorNode !== anchorNode ||
        state.openState.anchorOffset !== anchorOffset)
    ) {
      hide({ explicit: false, clearSearch: false });
    }

    if (!state.openState) {
      const capture = { capture: true };
      hostNode.addEventListener('keydown', handleKeyDown, capture);
      hostNode.addEventListener('keyup', handleKeyUp, capture);
      state.openState = {
        anchorNode,
        anchorOffset,
        currentOffset,
        searchValue,
        // The current height of 3 search results, likely correct (but will be tweaked regardless)
        desiredHeight: (searchValue && state.lastDesiredHeight) || 240,
        selectedIndex: 0,
        running: false,
        onClose: () => {
          hostNode.removeEventListener('keydown', handleKeyDown, capture);
          hostNode.removeEventListener('keyup', handleKeyUp, capture);
        },
      };
      state.hiddenFor = null;

      const elem = state.elem;
      elem.style.top = '-1000px';
      elem.style.left = '-1000px';
      elem.style.display = 'block';
      window.setTimeout(place, 0);
    }

    state.openState.currentOffset = currentOffset;
    state.openState.searchValue = searchValue;
    messageRouter.sendCommand('hud', 'updateSearch', { value: searchValue });

    place();
  };

  messageRouter.addCommandHandler('hud', 'hud:hide', async () => {
    hide({ explicit: true, clearSearch: true });
  });
  messageRouter.addCommandHandler('hud', 'hud:hideAfterRun', async () => {
    hide({ explicit: false, clearSearch: true });
  });
  messageRouter.addCommandHandler(
    'hud',
    'hud:updateHeight',
    async ({ height }: { height: number }) => {
      if (state.openState) {
        state.openState.desiredHeight = height;
        place();
      }
    }
  );
  messageRouter.addCommandHandler('hud', 'hud:prepareRun', async () => {
    if (!state.openState) {
      return;
    }

    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    if (selection.anchorNode) {
      selection.setBaseAndExtent(
        state.openState.anchorNode,
        state.openState.anchorOffset - 1,
        selection.anchorNode,
        selection.anchorOffset
      );
    } else {
      selection.setBaseAndExtent(
        state.openState.anchorNode,
        state.openState.anchorOffset - 1,
        state.openState.anchorNode,
        state.openState.anchorOffset + state.openState.searchValue.length
      );
    }
  });

  document.addEventListener('keyup', (e) => {
    // Chrome sometimes doesn't even trigger an input event on backspace?
    if (e.code === 'Backspace') {
      handleUpdate();
    }
  });

  document.addEventListener('input', (e) => {
    // Chrome doesn't trigger selectionchange on backspace within text. https://bugs.chromium.org/p/chromium/issues/detail?id=725890
    if ((e as InputEvent).inputType === 'deleteContentBackward') {
      handleUpdate();
    }
  });
  document.addEventListener('selectionchange', handleUpdate);
  window.addEventListener('resize', place);
  handleUpdate();
};

const messageRouter = getMessageRouter();
initialize(messageRouter);
