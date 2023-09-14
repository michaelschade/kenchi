import { useMemo, useState } from 'react';

import { Text } from 'slate';

import { SlateElement, SlateNode } from '@kenchi/slate-tools/lib/types';

import Element from './elements/Element';
import Leaf from './elements/Leaf';
import { ShowMoreProvider } from './elements/ShowMore';

const render = (
  element: SlateNode,
  opts: Required<RenderOpts>,
  path: number[]
) => {
  const key = path.join(':');
  if (Text.isText(element)) {
    return (
      <Leaf key={key} leaf={element}>
        {element.text}
      </Leaf>
    );
  }

  return (
    <Element key={key} element={element} {...opts}>
      {element.children.map((c, i) => render(c, opts, [...path, i]))}
    </Element>
  );
};

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function PreviewRenderer({
  contents,
  onExpand,
  showMore = true,
  maxLength = 140,
  ...props
}: {
  onExpand?: () => void;
  showMore?: boolean;
  maxLength?: number;
} & RendererProps) {
  const [expand, setExpand] = useState(false);

  const preview = !expand && getPreview(contents, maxLength, showMore);
  if (!preview) {
    return <Renderer {...props} contents={contents} />;
  }

  return (
    <ShowMoreProvider
      value={() => {
        setExpand(true);
        onExpand?.();
      }}
    >
      <Renderer {...props} contents={preview} />
    </ShowMoreProvider>
  );
}

export type RenderOpts = {
  singleLine?: boolean;
  insertText?: boolean;
  voidWrap?: boolean;
};

type RendererProps = { contents: SlateNode[] } & RenderOpts & DivProps;
export default function Renderer({
  contents,
  singleLine,
  insertText,
  voidWrap,
  ...props
}: RendererProps) {
  const rendered = useMemo(
    () => getRenderedComponents(contents, { singleLine, insertText, voidWrap }),
    [contents, singleLine, insertText, voidWrap]
  );
  if (singleLine) {
    return <>{rendered}</>;
  } else {
    return <div {...props}>{rendered}</div>;
  }
}

export function getRenderedComponents(contents: SlateNode[], opts: RenderOpts) {
  const defaultOpts = {
    singleLine: opts.singleLine || false,
    insertText: opts.insertText || false,
    voidWrap: opts.voidWrap || false,
  };
  return contents.map((e, i) => render(e, defaultOpts, [i]));
}

function getPreview(
  slate: SlateNode[],
  maxLength: number,
  showMore: boolean
): SlateNode[] | null {
  let length = 0;
  let wasTruncated = false;
  const recurse = (node: SlateNode): SlateNode | false => {
    if (length > maxLength) {
      wasTruncated = true;
      return false;
    } else if (node.text === undefined) {
      if (!node.type || node.type === 'paragraph') {
        length += 10; // Arbitrarily consider newlines 10 chars
      } else if (node.type === 'variable') {
        length += node.placeholder.length;
      } else if (node.type === 'image') {
        length += 30; // Arbitrarily consider images 30 chars
      }
      const newNode: SlateElement = { ...node, children: [] };
      for (var i = 0; i < node.children.length; i++) {
        const newChild = recurse(node.children[i]);
        if (newChild === false) {
          if (i === 0) {
            return false;
          } else {
            break;
          }
        } else {
          newNode.children.push(newChild);
        }
      }
      return newNode;
    } else {
      length += node.text.length;
      if (length > maxLength) {
        const charsAllowed = Math.max(
          0,
          node.text.length - (length - maxLength)
        );
        wasTruncated = true;
        let trimmedText = node.text.substr(0, charsAllowed);
        //re-trim if we are in the middle of a word
        trimmedText = trimmedText.substr(
          0,
          Math.min(trimmedText.length, trimmedText.lastIndexOf(' '))
        );
        return { ...node, text: trimmedText };
      } else {
        return node;
      }
    }
  };
  const preview: SlateNode[] = slate
    .map(recurse)
    .filter((n) => n !== false) as SlateNode[];
  if (!wasTruncated) {
    return null;
  }

  if (showMore) {
    let lastElement: SlateNode | null = preview[preview.length - 1];
    while (
      lastElement.children &&
      lastElement.children[lastElement.children.length - 1].text === undefined
    ) {
      lastElement = lastElement.children[lastElement.children.length - 1];
    }
    if (
      lastElement.children &&
      lastElement.children[lastElement.children.length - 1].text !== undefined
    ) {
      lastElement.children.push({
        type: 'show-more',
        children: [{ text: '' }],
      });
    } else {
      // Should never happen but cover our bases
      preview.push({
        children: [{ type: 'show-more', children: [{ text: '' }] }],
      });
    }
  }
  return preview;
}
