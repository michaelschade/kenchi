import React, { Children, useEffect, useRef, useState } from 'react';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { faCaretDown } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as Radix from '@radix-ui/react-collapsible';
import classNames from 'classnames';
import { Node } from 'slate';
import { useSelected } from 'slate-react';

import {
  CollapsibleElement,
  CollapsibleListItemElement,
} from '@kenchi/slate-tools/lib/types';

import { forgivingLocalGet, forgivingLocalSet } from '../../utils';

const open = keyframes`
  from {
    height: 0;
  }
  to {
    height: var(--radix-collapsible-content-height);
  }
`;

const close = keyframes`
  from {
    height: var(--radix-collapsible-content-height);
  }
  to {
    height: 0;
    // Necessary to make up/down selection work. Left/right unfortunately still
    // kind of moves the cursor inside of the closed content :(
    visibility: hidden;
  }
`;

const Element = styled.div`
  position: relative;

  &[data-slate-node]:hover,
  &[data-slate-node].selected {
    background-color: ${({ theme }) => theme.colors.gray[2]};
  }

  > .icon {
    color: ${({ theme }) => theme.colors.gray[10]};
    font-size: 1.2em;
    cursor: pointer;
    transform-origin: 0.4rem 0.8rem;
    position: absolute;
    top: -2px;
  }

  > .icon {
    left: 0rem;
  }
  > .header {
    margin-left: 1em;
  }

  ul > & {
    list-style-type: none;

    > .icon {
      left: -1rem;
    }

    > .header {
      margin-left: 0;
    }
  }

  ol > & {
    > .icon {
      left: -0.1rem;
    }
    > .header {
      margin-left: 0.9em;
    }
  }

  &:not([data-slate-node]) > .header {
    cursor: pointer;
  }

  > .icon {
    transition: all 0.3s ease-in-out;

    &[data-state='closed'] {
      transform: rotate(-90deg);
    }
  }

  > .content {
    overflow: hidden;

    &.hide {
      position: absolute;
      visibility: hidden;
    }

    &[data-state='open'] {
      animation: ${open} 0.3s ease-in-out forwards;
    }

    &[data-state='closed'] {
      animation: ${close} 0.3s ease-in-out forwards;
    }

    > .hint {
      position: absolute;
      color: ${({ theme }) => theme.colors.gray[9]};
      user-select: none;
      pointer-events: none;
    }
  }
`;

const STATE_KEY = `collapsible:`;
const OPEN_STATE = '1';
const CLOSED_STATE = '0';

type Props = {
  attributes?: Record<string, any>;
  children: React.ReactNode;
  element: CollapsibleElement | CollapsibleListItemElement;
};

export function Collapsible({
  attributes,
  children,
  element,
  as,
}: Props & { as?: React.ElementType }) {
  const [open, setOpen] = useState<boolean>(() => {
    const state = forgivingLocalGet(`${STATE_KEY}${element.id}`);
    return state ? state === OPEN_STATE : true;
  });

  useEffect(() => {
    const state = open ? OPEN_STATE : CLOSED_STATE;
    forgivingLocalSet(`${STATE_KEY}${element.id}`, state);
  }, [open, element.id]);

  // In order to animate the content sliding in properly, Radix needs to
  // calculate its height. It does this by disabling animations and measuring
  // the full box, followed by re-enabling animations so the object is hidden
  // (since we rely on the animation end state to set height to 0). Two things
  // are wrong about this:
  //
  // 1. It only looks for the style set on the element to determine animation,
  //    so we'd need to set it there
  // 2. It doesn't actually work for some reason
  //
  // To work around this we make it so that, if the content is loaded closed, we
  // hide it ourselves. We can't do this with display: none because that would
  // prevent Radix from calculating the correct height, so the open animation
  // wouldn't work. Instead we use visibility: hidden and position: absolute.
  //
  // Note that this all only applies if we enable forceMount on Content, which
  // we need to do because Slate expects the nodes to exist.
  const [needsClosedHack, setNeedsClosedHack] = useState(() => !open);

  // Radix leaves its --radix-collapsible-content-height variable around, since
  // when the animation finishes  due to its 'animationFillMode: forwards'
  // setting it'll continue to have a statically set height. However, the user
  // could continue typing, which would cause the height to change. Override it
  // to `auto` to avoid issues.
  const [overrideHeight, setOverrideHeight] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const contentEl = contentRef.current;
    if (contentEl) {
      const cb = () => setOverrideHeight(true);
      contentEl.addEventListener('animationend', cb);
      return () => contentEl.removeEventListener('animationend', cb);
    }
  }, []);
  useEffect(() => {
    setOverrideHeight(false);
  }, [open]);

  const selected = useSelected();

  const onClick = () => {
    setOpen((o) => !o);
    setNeedsClosedHack(false);
  };

  const childArr = Children.toArray(children);
  const header = childArr.shift();
  const showShadowContent =
    element.children.length === 2 &&
    element.children[1].type === 'paragraph' &&
    Node.string(element.children[1]) === '';

  return (
    <Radix.Root open={open} onOpenChange={(o) => setOpen(o)} asChild>
      <Element {...attributes} className={classNames({ selected })} as={as}>
        <Radix.Trigger asChild>
          <span className="icon" contentEditable={false} onClick={onClick}>
            <FontAwesomeIcon icon={faCaretDown} />
          </span>
        </Radix.Trigger>
        <div className="header" onClick={attributes ? undefined : onClick}>
          {header}
        </div>
        <Radix.Content
          ref={contentRef}
          style={{
            animationDuration: '0.3s',
            animationFillMode: 'forwards',
            ...(overrideHeight
              ? { '--radix-collapsible-content-height': 'auto' }
              : {}),
          }}
          className={classNames('content', { hide: needsClosedHack })}
          forceMount
        >
          {showShadowContent && (
            <span className="hint" contentEditable={false}>
              Anything in here will collapse
            </span>
          )}
          {childArr}
        </Radix.Content>
      </Element>
    </Radix.Root>
  );
}

export function CollapsibleListItem(props: Props) {
  return <Collapsible {...props} as="li" />;
}
