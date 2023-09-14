export function lighterLogger(
  level: 'log' | 'debug',
  msg: string,
  details?: {}
) {
  if (level === 'debug') {
    return;
  }
  if (details) {
    console.debug(msg, details);
  } else {
    console.debug(msg);
  }
}

export function applyStyles(
  el: HTMLElement,
  styles: { [key: string]: string | number }
) {
  el.removeAttribute('style');
  for (var i in styles) {
    (el.style as any)[i] = styles[i];
  }
}

export function injectStylesheet(contents?: string | null) {
  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  const styleParent = document.querySelector('head') || document.body;
  if (contents) {
    style.textContent = contents;
  }
  styleParent.appendChild(style);
  return style;
}

const NAME_REGEX = /^\w*$/;
export function injectScript(name: string) {
  // TODO: add listeners to figure out if this injection succeeded
  if (!name.match(NAME_REGEX)) {
    throw new Error('Request to inject invalid script');
  }
  const script = document.createElement('script');
  script.src = `${process.env.SCRIPTS_HOST}/js/${name}.bundle.js`;
  document.documentElement.appendChild(script);
}

export function isEditable(node: HTMLElement | null) {
  if (!node) {
    return false;
  }

  return (
    node.nodeName === 'INPUT' ||
    node.nodeName === 'TEXTAREA' ||
    node.isContentEditable
  );
}

const getClipboardDiv = () => {
  const div = document.createElement('div');
  // If we don't put this on screen it'll cause the focus/scroll to jump around
  // the page, which is jarring
  applyStyles(div, { position: 'fixed', top: 0, left: 0 });
  div.setAttribute('contentEditable', 'true');
  return div;
};

type ClipboardData = Record<string, string>;

const getClipboardData = (): Promise<ClipboardData> => {
  return new Promise((resolve) => {
    const div = getClipboardDiv();
    const data: ClipboardData = {};
    document.addEventListener(
      'paste',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const clipboardData = e.clipboardData;
        if (clipboardData) {
          clipboardData.types.forEach((format) => {
            data[format] = clipboardData.getData(format);
          });
        }
        document.body.removeChild(div);
        resolve(data);
      },
      { capture: true, once: true }
    );
    document.body.appendChild(div);
    div.focus();
    document.execCommand('paste', false);
  });
};

const setClipboardData = (data: ClipboardData): Promise<void> => {
  return new Promise((resolve) => {
    const div = getClipboardDiv();
    document.addEventListener(
      'copy',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const clipboardData = e.clipboardData;
        if (clipboardData) {
          Object.keys(data).forEach((format) => {
            clipboardData.setData(format, data[format]);
          });
        }
        document.body.removeChild(div);
        resolve();
      },
      { capture: true, once: true }
    );
    document.body.appendChild(div);
    div.focus();
    document.execCommand('copy', false);
  });
};

export const captureSelection = (
  requireContentEditable: boolean,
  parent?: Node
) => {
  let parentWindow;
  if (parent) {
    parentWindow = parent.ownerDocument?.defaultView;
  }
  parentWindow ||= window;
  const selection = parentWindow.getSelection();
  if (!selection?.anchorNode || !selection?.focusNode) {
    return null;
  }
  if (requireContentEditable) {
    const el = selection.anchorNode.parentElement;
    if (!el || !el.closest('[contenteditable]')) {
      return null;
    }
  }
  if (parent && !parent.contains(selection.anchorNode)) {
    return null;
  }
  const origSelection = {
    anchorNode: selection.anchorNode,
    anchorOffset: selection.anchorOffset,
    focusNode: selection.focusNode,
    focusOffset: selection.focusOffset,
  };

  const focusSelection = async () => {
    // Anecdotally this makes the selection work better...
    await waitFor0();
    selection.setBaseAndExtent(
      origSelection.anchorNode,
      origSelection.anchorOffset,
      origSelection.focusNode,
      origSelection.focusOffset
    );
    await waitFor0();
  };

  // Gmail and Zendesk are both...weird and don't always focus properly, so focus twice.
  // TODO: maybe only do this in certain circumstances?
  return async () => {
    await focusSelection();
    await focusSelection();
  };
};

// Use the selection or appends if there is none
export const focusElem = (e: HTMLElement) => async () => e.focus();
// Replace entire contents
export const focusElemAndSelect = (e: HTMLElement) => async () => {
  e.focus();
  if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
    e.select();
  }
};

// document.execCommand('insertText', ...) doesn't allow rich content, so we use copy/paste
export async function insertTextViaPaste(
  { text, html }: { text: string; html?: string },
  focusForPaste: () => Promise<void>,
  documentForPaste = window.document
): Promise<boolean> {
  const oldData = await getClipboardData();

  const formattedData: ClipboardData = {};
  if (html) {
    formattedData['text/html'] = html;
  }
  if (text) {
    formattedData['text/plain'] = text;
  }

  await setClipboardData(formattedData);

  // Reset focus and paste
  await focusForPaste();
  documentForPaste.execCommand('paste', false);

  // Our old focus isn't valid anymore, so to preserve cursor location re-capture it

  // Zendesk seems to have a slightly deferred normalization after paste, so our
  // selection won't be valid right away.
  await waitFor0();

  const focusAfterClipboardReset = captureSelection(false);

  await setClipboardData(oldData);

  focusAfterClipboardReset?.();

  return true;
}

export async function waitFor0(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

export function shouldTriggerHudInjection(el: unknown): el is HTMLElement {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  return el.isContentEditable || el.nodeName === 'TEXTAREA';
}
