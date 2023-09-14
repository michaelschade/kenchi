import { useRef } from 'react';

import { css } from '@emotion/react';
import {
  faCircleNotch,
  faExclamationTriangle,
  faExpandAlt,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useFocused, useSelected } from 'slate-react';

import { ImageElement } from '@kenchi/slate-tools/lib/types';
import Tooltip from '@kenchi/ui/lib/Tooltip';

import { selectableElementStyle } from '../Editor/ElementWithPopover';

const style = css`
  position: relative;

  &:hover .icon.open,
  &.selected .icon.open {
    display: block;
  }

  a &:hover .icon.open,
  a &.selected .icon.open {
    display: none;
  }

  .icon {
    svg {
      color: white;
    }

    &.uploading svg {
      animation: fa-spin 2s linear infinite;
    }

    &.open {
      cursor: pointer;
      display: none;
    }

    position: absolute;
    top: 5px;
    left: 5px;
    padding: 2px 4px;
    border-radius: 5px;
    background-color: #235c94;
    box-shadow: 0px 1px 5px 0px #2c3f525c;
  }

  img {
    width: 100%;
    vertical-align: bottom;
  }
`;

export default function Image({
  insertText,
  element: { url, href, uploading, error },
  inEditor,
}: {
  insertText: boolean;
  element: ImageElement;
  inEditor: boolean;
}) {
  const selected = useSelected();
  const focused = useFocused();
  const ref = useRef<HTMLImageElement>(null);

  const img = <img ref={ref} src={url} alt="" />;

  // Shortcut interactivity
  if (insertText) {
    if (href) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {img}
        </a>
      );
    } else {
      return img;
    }
  }

  const open = async () => {
    let features = 'status=no,location=no,toolbar=no,menubar=no';
    const img = ref.current;
    if (img) {
      features += `,scrollbars=no,resizable=no,width=${img.naturalWidth},height=${img.naturalHeight}`;
    }
    if (url.startsWith('data:image/')) {
      const res = await fetch(url);
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), undefined, features);
    } else {
      window.open(url, undefined, features);
    }
  };
  let icon;
  if (uploading) {
    icon = (
      <Tooltip placement="right" overlay="Uploading…" mouseEnterDelay={0}>
        <div className="icon uploading">
          <FontAwesomeIcon icon={faCircleNotch} size="1x" title="Uploading…" />
        </div>
      </Tooltip>
    );
  } else if (error) {
    let message;
    if (error === 'forbidden') {
      message =
        'The site you copied your image from does not allow pasting it into other places. Instead, try saving it to your computer and then dragging it into Kenchi.';
    } else {
      message =
        "There was an error saving this image, most likely because the place it's stored won't let us access it. Try saving it to your computer and then dragging that file into Kenchi.";
    }
    icon = (
      <Tooltip placement="right" overlay={message} mouseEnterDelay={0}>
        <div className="icon error">
          <FontAwesomeIcon icon={faExclamationTriangle} size="1x" />
        </div>
      </Tooltip>
    );
  } else {
    icon = (
      <Tooltip
        placement="right"
        overlay="View full-size image"
        mouseEnterDelay={0}
      >
        <div onClick={open} className="icon open">
          <FontAwesomeIcon icon={faExpandAlt} size="1x" title="View Image" />
        </div>
      </Tooltip>
    );
  }
  const rtn = (
    <div
      css={inEditor ? [style, selectableElementStyle] : style}
      className={selected ? 'selected' : ''}
      data-selected={selected && focused}
    >
      {icon}
      {img}
    </div>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {rtn}
      </a>
    );
  } else {
    return rtn;
  }
}
