import {
  DragEvent as ReactDragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { ApolloClient, gql, useApolloClient } from '@apollo/client';
import { css } from '@emotion/react';
import { captureMessage } from '@sentry/react';
import { Editor, Element, Node as SlateNode, PathRef, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';

import Result, { failure, isFailure, success } from '@kenchi/shared/lib/Result';
import { ImageUploadError, SlateElement } from '@kenchi/slate-tools/lib/types';

import { KenchiErrorFragment } from '../../graphql/fragments';
import {
  UploadFileMutation,
  UploadFileMutationVariables,
} from '../../graphql/generated';
import { trackEvent } from '../../utils/analytics';

const UPLOAD_FILE = gql`
  mutation UploadFileMutation($file: Upload, $url: String) {
    uploadFile(file: $file, url: $url) {
      url
      error {
        ...KenchiErrorFragment
      }
    }
  }
  ${KenchiErrorFragment}
`;

const IMAGE_URL_REPLACEMENT: Record<string, string> = {};
const EDITORS = new Set<ReactEditor>();

// We don't want to have to track editors for the async post-upload update, so
// globally register-unregister editors so we can iterate over them and replace
// all pending image uploads when they complete.
export const registerEditor = (editor: ReactEditor) => {
  EDITORS.add(editor);
  return () => {
    EDITORS.delete(editor);
  };
};

// The 0.25ems are all to account for the usual style of the div this is in: we
// should move the styling inside of Editor so we can be sure it's the same
// (plus then we can put this outside of the padding and not need to explicitly
// account for it).
const dragHintStyle = css`
  position: absolute;
  top: -0.25em;
  left: -0.25em;
  right: -0.25em;
  bottom: -0.25em;

  user-select: none;
  color: white;
  font-size: 0.9em;
  font-weight: 700;
  border-radius: 0.2rem;
  border: 2px dashed #2c3f52b8;
  background-color: #4d57618f;
  z-index: 99;

  &.drag-invalid {
    background-color: #614d5cdb;
    border: 2px dashed #463742f2;
  }

  &.drag-valid {
    background-color: #4d5761bd;
  }

  & > div {
    position: absolute;
    top: 50%;
    width: 100%;
    padding: 10px;
    text-align: center;
    transform: translateY(-50%);
  }
`;

const VALID_IMAGE_TYPES = new Set(['image/png', 'image/gif', 'image/jpeg']);

const isValidDrag = (e: DragEvent | ReactDragEvent) => {
  if (!e.dataTransfer) {
    return false;
  }
  const items = e.dataTransfer.items;
  if (items.length > 0) {
    const item = items[0];
    if (item.kind !== 'file') {
      // We're probably dragging text around, let someone else handle it.
      return false;
    }
    if (!VALID_IMAGE_TYPES.has(item.type)) {
      return "Sorry, this doesn't look like a valid file. We support uploading GIF, JPEG, and PNG images.";
    }
    return true;
  } else {
    // Only Chrome lets you access `items` suring a drag to check type.
    return e.dataTransfer.types.includes('Files');
  }
};

export function ImageDropHandler() {
  const [overWindow, setOverWindow] = useState<boolean | string>(false);
  const [overEditor, setOverEditor] = useState(false);

  const client = useApolloClient();

  useEffect(() => {
    let timeout: number | null = null;
    const over = (e: DragEvent) => {
      if (timeout) {
        window.clearTimeout(timeout);
        timeout = null;
      }
      const overWindow = isValidDrag(e);
      if (overWindow) {
        setOverWindow(overWindow);
        // We need to preventDefault so it doesn't reset the drag
        // See https://developer.mozilla.org/en-US/docs/Web/API/Document/dragover_event "Default action"
        e.preventDefault();
      }
    };
    const leave = (e: DragEvent) => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => {
        setOverWindow(false);
      }, 10);
    };
    document.body.addEventListener('dragover', over);
    document.body.addEventListener('dragleave', leave);
    document.body.addEventListener('dragend', leave);
    document.body.addEventListener('drop', leave);
    return () => {
      document.body.removeEventListener('dragover', over);
      document.body.removeEventListener('dragleave', leave);
      document.body.removeEventListener('dragend', leave);
      document.body.removeEventListener('drop', leave);
    };
  }, []);

  const cancelDrop = useCallback((e: ReactDragEvent) => {
    e.preventDefault();
    setOverWindow(false);
    setOverEditor(false);
  }, []);

  const editor = useSlate();

  const handleDrop = useCallback(
    (e: ReactDragEvent) => {
      // Don't open the file regardless of its validity
      cancelDrop(e);

      if (isValidDrag(e) !== true) {
        // Shouldn't happen
        return;
      }

      if (e.dataTransfer.files.length === 0) {
        // Shouldn't happen since we check this is a file in isValidDrag
        return;
      }

      for (var i = 0; i < e.dataTransfer.files.length; i++) {
        trackEvent({
          category: 'workflow_editor',
          action: 'upload_image_drag',
          label: 'Upload image from dragging',
        });
        insertImage(editor, e.dataTransfer.files[i], client);
      }
    },
    [cancelDrop, editor, client]
  );

  const divRef = useRef<HTMLDivElement>(null);
  const onDragLeave = useCallback(
    (e: ReactDragEvent) => {
      const div = divRef.current;
      if (
        div &&
        e.relatedTarget instanceof Node &&
        !div.contains(e.relatedTarget)
      ) {
        setOverEditor(false);
      }
    },
    [divRef]
  );

  if (overWindow) {
    if (overWindow === true) {
      return (
        <div
          ref={divRef}
          css={dragHintStyle}
          className={overEditor ? 'drag-valid' : ''}
          onDragEnter={() => setOverEditor(true)}
          onDragLeave={onDragLeave}
          onDrop={handleDrop}
        >
          <div>Drag image here to upload.</div>
        </div>
      );
    } else {
      // Messaging some kind of issue. Don't let a drop here cause the file to open
      return (
        <div css={dragHintStyle} className="drag-invalid" onDrop={cancelDrop}>
          <div>{overWindow}</div>
        </div>
      );
    }
  }
  return null;
}

export default function withImages(
  editor: ReactEditor,
  client: ApolloClient<object>
) {
  const { isVoid, normalizeNode, insertData } = editor;
  editor.isVoid = (element) =>
    element.type === 'image' ? true : isVoid(element);
  editor.normalizeNode = (entry) => {
    const [el, path] = entry;
    if (Element.isElement(el) && el.type === 'image' && el.uploading) {
      const url = el.url as string;
      if (url in IMAGE_URL_REPLACEMENT) {
        Transforms.setNodes(
          editor,
          { url: IMAGE_URL_REPLACEMENT[url], uploading: undefined },
          { at: path }
        );
        return;
      }
    }
    return normalizeNode(entry);
  };
  editor.insertData = (data) => {
    if (data.files.length > 0) {
      for (var i = 0; i < data.files.length; i++) {
        trackEvent({
          category: 'workflow_editor',
          action: 'upload_image_copy',
          label: 'Upload image from copy/pasing',
        });
        insertImage(editor, data.files[i], client);
      }
    }
    return insertData(data);
  };
  return editor;
}

async function insertImage(
  editor: Editor,
  file: File,
  client: ApolloClient<object>
) {
  const localUrl = URL.createObjectURL(new Blob([file], { type: file.type }));

  const image: SlateElement = {
    type: 'image',
    url: localUrl,
    uploading: true,
    children: [{ text: '' }],
  };
  const newNode: SlateElement = {
    type: 'void-wrapper',
    children: [
      { type: 'void-spacer', children: [{ text: '' }] },
      image,
      { type: 'void-spacer', children: [{ text: '' }] },
    ],
  };

  Transforms.insertNodes(editor, newNode);

  const mutation = await client.mutate<
    UploadFileMutation,
    UploadFileMutationVariables
  >({
    mutation: UPLOAD_FILE,
    variables: { file },
    context: { hasUpload: true },
  });

  const uploadFile = mutation.data?.uploadFile;

  let result: Result<string, ImageUploadError>;
  if (!uploadFile || uploadFile.error || !uploadFile.url) {
    captureMessage(`File upload failure`, {
      extra: { error: uploadFile?.error },
    });
    result = failure('unknown');
  } else {
    result = success(uploadFile.url);
  }

  handleUploadComplete(localUrl, result);
}

export async function uploadImageFromURL(
  url: string,
  client: ApolloClient<object>
) {
  let response;
  try {
    response = await fetch(url, { mode: 'no-cors' });
  } catch (e) {
    // Couldn't download the image, instead get the server to pull it
  }

  let likelyError: ImageUploadError = 'unknown';
  const variables: UploadFileMutationVariables = {};
  if (response?.status === 200) {
    const blob = await response.blob();

    let filename;
    let type;
    const urlParts = new URL(url);
    if (urlParts.protocol === 'data:') {
      type = urlParts.pathname.split(';')[0];
      filename = `image.${type.split('/')[1]}`;
    } else {
      const pathParts = urlParts.pathname.split('/');
      filename = pathParts.pop()!;
      type = response.headers.get('Content-Type') || undefined;
    }

    variables.file = new File([blob], filename, { type });
  } else {
    variables.url = url;
    if (response?.status === 403) {
      likelyError = 'forbidden';
    }
  }

  const result = await client.mutate<
    UploadFileMutation,
    UploadFileMutationVariables
  >({
    mutation: UPLOAD_FILE,
    variables,
    context: { hasUpload: true },
  });

  const successUrl = result.data?.uploadFile?.url;
  if (successUrl) {
    return success(successUrl);
  } else {
    return failure(likelyError);
  }
}

const replaceImages = (
  localUrl: string,
  replace: { error: ImageUploadError } | { url: string }
) => {
  let count = 0;
  EDITORS.forEach((editor) => {
    const pathsToSet: PathRef[] = [];
    for (const [el, path] of SlateNode.elements(editor)) {
      if (el.type !== 'image' || !el.uploading) {
        continue;
      }
      if (el.url !== localUrl) {
        continue;
      }
      pathsToSet.push(Editor.pathRef(editor, path));
    }

    pathsToSet.forEach((path) => {
      const at = path.unref();
      if (at) {
        Transforms.setNodes(
          editor,
          { uploading: undefined, ...replace },
          { at }
        );
      }
    });
    count += pathsToSet.length;
  });
  return count;
};

export async function handleUploadComplete(
  localUrl: string,
  result: Result<string, ImageUploadError>
) {
  // We search the whole tree because it's possible to copy paste while the image is still uploading

  if (isFailure(result)) {
    replaceImages(localUrl, { error: result.error });
    trackEvent({
      category: 'editor',
      action: `upload_image_failed_${result.error}`,
      label: 'Upload image failed',
    });
    return;
  }
  const remoteUrl = result.data;

  // For normalization in case they paste the still-loading image
  IMAGE_URL_REPLACEMENT[localUrl] = remoteUrl;

  // Make sure it's not GCed before it's loaded...I'm guessing that's a thing
  // that could happen
  let preload: HTMLImageElement;
  const preloadImage = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      preload = new Image();
      preload.addEventListener('load', () => resolve());
      preload.addEventListener('error', (event) => reject(event.error));
      preload.src = remoteUrl;
    });
  };

  await preloadImage();
  const count = replaceImages(localUrl, { url: remoteUrl });
  URL.revokeObjectURL(localUrl);

  trackEvent({
    category: 'performance',
    action: 'upload_image',
    label: 'Upload image succeeded',
    images: count,
  });
}
