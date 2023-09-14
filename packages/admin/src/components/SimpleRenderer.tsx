// TECH DEBT TODO: dedupe this with the frontend Renderer

import { useMemo } from 'react';

type LeafProps = {
  children: React.ReactNode;
  leaf: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    code?: boolean;
  };
};
function Leaf({ children, leaf }: LeafProps) {
  if (typeof children === 'string' && children === '') {
    // ZERO WIDTH NO-BREAK SPACE
    // The editor automatically does this, but the Renderer does not.
    children = '\uFEFF';
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.bold) {
    children = <b>{children}</b>;
  }

  if (leaf.italic) {
    children = <i>{children}</i>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <>{children}</>;
}

type ElementProps = {
  children: React.ReactNode;
  element: {
    type?: string;
    [key: string]: unknown;
  };
};
const Element = ({ children, element }: ElementProps) => {
  switch (element.type) {
    case 'image':
      // eslint-disable-next-line jsx-a11y/alt-text
      return <img width={400} src={element.url as any} />;
    case 'heading':
      return <h3>{children}</h3>;
    case 'bulleted-list':
      return <ul>{children}</ul>;
    case 'numbered-list':
      return <ol>{children}</ol>;
    case 'list-item':
      return <li>{children}</li>;
    case 'link':
      return <a href={element.url as any}>{children}</a>;
    case 'paragraph':
    case undefined:
      return <p>{children}</p>;
    case 'void-wrapper':
      return <>{children}</>;
    case 'void-spacer':
      return null;
    default:
      const { type, children: _c, ...rest } = element;
      const attributes = Object.entries(rest)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      return <code>{`<${element.type} ${attributes} />`}</code>;
  }
};

const render = (element: SlateNode, path: number[]) => {
  const key = path.join(':');
  if ('text' in element) {
    return (
      <Leaf key={key} leaf={element as any}>
        {element.text}
      </Leaf>
    );
  }

  return (
    <Element key={key} element={element}>
      {element.children?.map((c, i) => render(c, [...path, i]))}
    </Element>
  );
};

type SlateNode =
  | { text: string; children?: never; [key: string]: any }
  | { text?: never; children: SlateNode[]; [key: string]: any };

export default function SimpleRenderer({
  contents,
}: {
  contents: SlateNode[];
}) {
  const rendered = useMemo(
    () => contents.map((e, i) => render(e, [i])),
    [contents]
  );
  return <div>{rendered}</div>;
}
