import { RenderLeafProps } from 'slate-react';

type LeafProps = Omit<Omit<RenderLeafProps, 'attributes'>, 'text'> & {
  attributes?: RenderLeafProps['attributes'];
  text?: RenderLeafProps['text'];
};

export default function Leaf({
  attributes,
  children,
  leaf,
}: LeafProps): JSX.Element {
  if (attributes && typeof children === 'string' && children === '') {
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

  // Editor
  if (attributes) {
    children = <span {...attributes}>{children}</span>;
  }

  return children;
}
