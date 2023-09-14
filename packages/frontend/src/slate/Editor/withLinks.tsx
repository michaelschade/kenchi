import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { faLink } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import isHotkey from 'is-hotkey';
import isUrl from 'is-url';
import { Editor, Element, Node, Path, Range, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import {
  ImageElement,
  LinkElement,
  SlateElement,
  WorkflowLinkElement,
} from '@kenchi/slate-tools/lib/types';

import { trackEvent } from '../../utils/analytics';
import ImageLinkModal from './ImageLinkModal';
import TextLinkModal from './TextLinkModal';
import { Button } from './Toolbar';
import useSelectModal from './useSelectModal';

const isLink = (n: Node): n is LinkElement | WorkflowLinkElement =>
  Element.isElement(n) && (n.type === 'link' || n.type === 'workflow-link');

export function onKeyDown(linksRef: LinksRef, event: React.KeyboardEvent) {
  if (isHotkey('mod+k', event as any)) {
    event.preventDefault();
    linksRef.openModal();
  }
}

export default function withLinks(editor: ReactEditor) {
  const { insertData, insertText, isInline, isVoid } = editor;

  editor.isInline = (el) =>
    isLink(el) && el.children[0]?.type !== 'image' ? true : isInline(el);
  editor.isVoid = (el) => (el.type === 'workflow-link' ? true : isVoid(el));

  editor.insertText = (text) => {
    if (text && isUrl(text)) {
      wrapLink(editor, text, text);
    } else {
      const [link] = Editor.nodes(editor, { match: isLink });
      if (link && editor.selection && Range.isCollapsed(editor.selection)) {
        const [, linkPath] = link;
        const anchor = editor.selection.anchor;
        // If we're typing at the end of a link, make sure the text is outside
        // of the link. This matches how GDocs handles this state.
        if (Editor.isEnd(editor, anchor, linkPath)) {
          Editor.withoutNormalizing(editor, () => {
            Transforms.insertText(editor, text);
            Transforms.splitNodes(editor, { at: anchor, match: isLink });
            const newPath = editor.selection!.anchor.path;
            const newTextNode = Node.get(editor, newPath);
            Transforms.unsetNodes(
              editor,
              Object.keys(Node.extractProps(newTextNode)),
              { at: newPath }
            );
            Transforms.unwrapNodes(editor, {
              mode: 'all',
              match: (_, path) => linkPath.length <= path.length,
            });
          });
          return;
        }
      }
      insertText(text);
    }
  };

  editor.insertData = (data) => {
    const text = data.getData('text/plain');

    if (text && isUrl(text)) {
      wrapLink(editor, text, text);
    } else {
      insertData(data);
    }
  };

  return editor;
}

const isLinkActive = (editor: Editor) => {
  const [link] = Editor.nodes(editor, { match: isLink });
  if (link) {
    return true;
  }
  const [imageLink] = Editor.nodes(editor, {
    match: (n) => Element.isElement(n) && n.type === 'image' && !!n.href,
  });
  return !!imageLink;
};

export const unwrapLink = (editor: Editor) => {
  Transforms.unwrapNodes(editor, {
    voids: true,
    match: (n) => Element.isElement(n) && n.type === 'link',
  });
};

const imageIsSelected = (editor: Editor, selection?: Range | null) => {
  if (!selection) {
    return false;
  }
  const path = selection.focus.path;
  const [selectionNode] = Editor.node(editor, path.slice(0, path.length - 1));
  if (Element.isElement(selectionNode)) {
    return selectionNode.type === 'image';
  } else {
    return false;
  }
};

const wrapLink = (editor: Editor, url: string, text: string) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor);
  }

  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const link: Element = {
    type: 'link',
    children: [],
    url,
  };

  if (imageIsSelected(editor, selection)) {
    const path = selection!.focus.path;
    Transforms.setNodes(
      editor,
      { href: url },
      { at: Path.parent(path), voids: true }
    );
  } else if (
    isCollapsed ||
    (text && selection && Editor.string(editor, selection) !== text)
  ) {
    link.children.push({ text });
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true, voids: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
};

export type LinksRef = {
  openModal: () => void;
};

export const Toolbar = forwardRef(
  (
    {
      supportsWorkflowLinks,
      supportsUrlLinks,
    }: { supportsWorkflowLinks: boolean; supportsUrlLinks: boolean },
    ref: React.Ref<LinksRef>
  ) => {
    const editor = useSlate();

    const {
      show: showModal,
      open: openModal,
      close: closeModal,
      onMouseDown,
      editorSelection,
    } = useSelectModal('link');

    const [initialLinkNode, setInitialLinkNode] = useState<
      LinkElement | WorkflowLinkElement | null
    >(null);
    const [imageNode, setImageNode] = useState<ImageElement | null>(null);

    const addWorkflowLink = useCallback(
      (editor, workflow) => {
        closeModal();

        if (initialLinkNode) {
          trackEvent({
            category: 'workflow_editor',
            action: 'update_workflow_link',
            label: 'Update link to a different workflow in workflow editor',
          });
          if (initialLinkNode.type === 'workflow-link') {
            Transforms.setNodes(
              editor,
              { workflow: workflow.staticId },
              {
                match: (n) =>
                  Element.isElement(n) && n.type === 'workflow-link',
              }
            );
            return;
          }
          Transforms.removeNodes(editor, {
            match: (n) =>
              Element.isElement(n) && n.type === initialLinkNode.type,
          });
        } else {
          trackEvent({
            category: 'workflow_editor',
            action: 'insert_workflow_link',
            label: 'Insert link to a different workflow into workflow editor',
          });
        }

        const link: SlateElement = {
          type: 'workflow-link',
          workflow: workflow.staticId,
          children: [{ text: '' }],
        };
        Transforms.insertNodes(editor, link);
      },
      [initialLinkNode, closeModal]
    );

    const onImageLinkSubmit = useCallback(
      (url) => {
        closeModal();
        if (imageNode) {
          trackEvent({
            category: 'workflow_editor',
            action: 'update_url_link',
            label: 'Update URL in workflow editor',
          });
          Transforms.setNodes(
            editor,
            { href: url },
            { match: (n) => Element.isElement(n) && n.type === 'image' }
          );
        }
      },
      [imageNode, closeModal, editor]
    );

    const removeImageLink = useCallback(() => {
      closeModal();
      trackEvent({
        category: 'workflow_editor',
        action: 'remove_image_link',
        label: 'Remove link from image',
      });
      Transforms.unsetNodes(editor, 'href', {
        match: (n) => Element.isElement(n) && n.type === 'image',
      });
    }, [closeModal, editor]);

    const removeTextLink = useCallback(() => {
      closeModal();
      if (initialLinkNode?.type === 'link') {
        trackEvent({
          category: 'workflow_editor',
          action: 'remove_link',
          label: 'Remove link from text',
        });
        unwrapLink(editor);
      } else if (initialLinkNode?.type === 'workflow-link') {
        trackEvent({
          category: 'workflow_editor',
          action: 'remove_workflow_link',
          label: 'Remove workflow link',
        });
        Transforms.removeNodes(editor, {
          match: (n) => Element.isElement(n) && n.type === initialLinkNode.type,
        });
      }
    }, [initialLinkNode, closeModal, editor]);

    const setTextLink = useCallback(
      (text, url, originalValue) => {
        closeModal();
        if (initialLinkNode) {
          trackEvent({
            category: 'workflow_editor',
            action: 'update_url_link',
            label: 'Update URL in workflow editor',
          });
          // If we're just changing the URL no need to remove/replace the node
          if (
            initialLinkNode.type === 'link' &&
            text === Node.string(initialLinkNode)
          ) {
            Transforms.setNodes(
              editor,
              { url },
              { match: (n) => Element.isElement(n) && n.type === 'link' }
            );
            return;
          }
          Transforms.removeNodes(editor, {
            match: (n) =>
              Element.isElement(n) && n.type === initialLinkNode.type,
          });
        } else {
          trackEvent({
            category: 'workflow_editor',
            action: 'insert_url_link',
            label: 'Insert URL into workflow editor',
          });
        }

        wrapLink(editor, url, text || originalValue);
      },
      [initialLinkNode, closeModal, editor]
    );

    const openModalWithNode = useCallback(() => {
      const editorSelection = openModal();
      const [link] = Editor.nodes(editor, {
        at: editorSelection,
        match: isLink,
      });
      const initialNode = link ? link[0] : null;
      setInitialLinkNode(initialNode);

      const [image] = Editor.nodes(editor, {
        at: editorSelection,
        match: (n: Node): n is ImageElement =>
          Element.isElement(n) && n.type === 'image',
      });
      setImageNode((initialNode ? null : image?.[0]) || null);
    }, [editor, openModal]);

    useImperativeHandle(
      ref,
      () => ({
        openModal: openModalWithNode,
      }),
      [openModalWithNode]
    );

    let modal = null;
    if (supportsUrlLinks && imageIsSelected(editor, editorSelection)) {
      modal = (
        <ImageLinkModal
          isOpen={showModal}
          initialNode={imageNode}
          onUrlSubmit={onImageLinkSubmit}
          onClose={closeModal}
          onClickRemove={removeImageLink}
        />
      );
    } else {
      modal = (
        <TextLinkModal
          isOpen={showModal}
          withWorkflow={supportsWorkflowLinks}
          withUrl={supportsUrlLinks}
          initialNode={initialLinkNode}
          editorSelection={editorSelection}
          onUrlSubmit={setTextLink}
          onClose={closeModal}
          addWorkflow={addWorkflowLink}
          onClickRemove={removeTextLink}
        />
      );
    }

    return (
      <>
        {modal}
        <span style={{ position: 'relative' }}>
          <Button
            onClick={openModalWithNode}
            onMouseDown={onMouseDown}
            active={isLinkActive(editor)}
            tooltip="Insert link"
            shortcut="K"
          >
            <FontAwesomeIcon icon={faLink} />
          </Button>
        </span>
      </>
    );
  }
);
