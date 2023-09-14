import { captureException } from '@sentry/browser';

import { InsertionPath, KenchiMessageRouter } from '@kenchi/commands';

import {
  captureSelection,
  focusElem,
  focusElemAndSelect,
  insertTextViaPaste,
  isEditable,
} from '../../utils';
import HostInterface from '.';

function evaluatePath(command: InsertionPath, previous: Node): Node | null {
  switch (command.type) {
    case 'nest':
      let res = previous;
      for (let subCommand of command.commands) {
        const subRes = evaluatePath(subCommand, res);
        if (!subRes) {
          return null;
        }
        res = subRes;
      }
      return res;
    case 'fallback':
      for (let subCommand of command.commands) {
        const subRes = evaluatePath(subCommand, previous);
        if (subRes) {
          return subRes;
        }
      }
      return null;
    case 'contentDocument':
      if (previous instanceof HTMLIFrameElement) {
        return previous.contentDocument;
      } else {
        return null;
      }
    case 'shadowRoot':
      if (previous instanceof Element) {
        return previous.shadowRoot;
      } else {
        return null;
      }
    case 'querySelector':
      if (
        previous instanceof Document ||
        previous instanceof DocumentFragment ||
        previous instanceof Element
      ) {
        return previous.querySelector(command.value);
      } else {
        return null;
      }
    case 'xpath':
      try {
        const res = (previous.ownerDocument || document).evaluate(
          command.xpath,
          previous,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        return res || null;
      } catch (e) {
        captureException(e);
        return null;
      }
  }
}

export default class DefaultHostInterface implements HostInterface {
  private initialized = false;

  constructor(protected messageRouter: KenchiMessageRouter<'contentScript'>) {}

  async init(sidebarEl: HTMLIFrameElement) {
    if (!this.initialized) {
      document.body.appendChild(sidebarEl);
    }
    this.initialized = true;
    return true;
  }

  async open() {}
  async close() {}

  // document.execCommand('insertText', ...) doesn't allow rich content, so we use copy/paste
  async insertText(
    { text, html }: { text: string; html?: string },
    lastFocus: HTMLElement | null,
    refocusContentEditable: (() => Promise<void>) | null,
    path: InsertionPath | null,
    useSelection: boolean
  ): Promise<boolean> {
    let focusForPaste: () => Promise<void>;

    let documentForPaste: Document;
    if (path) {
      const elem = evaluatePath(path, document);

      if (!elem || !(elem instanceof HTMLElement)) {
        return false;
      }
      // In case elem is an iframe
      documentForPaste = elem.ownerDocument;
      if (useSelection) {
        focusForPaste = captureSelection(true, elem) || focusElem(elem);
      } else {
        focusForPaste = focusElemAndSelect(elem);
      }
    } else {
      documentForPaste = document;
      if (useSelection) {
        const maybeFocus = refocusContentEditable || captureSelection(true);
        if (maybeFocus) {
          focusForPaste = maybeFocus;
        } else if (lastFocus && isEditable(lastFocus)) {
          focusForPaste = focusElem(lastFocus);
        } else {
          return false;
        }
      } else {
        if (lastFocus && isEditable(lastFocus)) {
          focusForPaste = focusElemAndSelect(lastFocus);
        } else {
          return false;
        }
      }
    }

    return insertTextViaPaste({ text, html }, focusForPaste, documentForPaste);
  }
}
