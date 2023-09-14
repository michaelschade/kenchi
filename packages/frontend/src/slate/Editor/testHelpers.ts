import { Editor } from 'slate';
import { createHyperscript } from 'slate-hyperscript';

import { waitFor, waitTimeDoNotUse } from '../../testUtils';
import { getEditor } from '.';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      block: { children: any; type?: string; [key: string]: any };
      anchor: {};
      focus: {};
      cursor: {};
      editor: {};
      fragment: {};
    }
  }
}

const jsx = createHyperscript({
  elements: {
    block: {},
    ul: { type: 'bulleted-list' },
    ol: { type: 'numbered-list' },
    li: { type: 'list-item' },
    p: { type: 'paragraph' },
  },
});

// These were compiled with React's pragma, hackily convert them to the
// slate-hyperscript pragma
export const deepFix = (obj: any): any => {
  if (typeof obj !== 'object' || !obj.props) {
    return obj;
  }
  const { children, ...attributes } = obj.props;
  let fixedChildren;
  if (Array.isArray(children)) {
    fixedChildren = children.map(deepFix);
  } else {
    fixedChildren = [deepFix(children)];
  }
  return jsx(obj.type, attributes, ...fixedChildren);
};

export const test = (
  name: string,
  input: any,
  output: any,
  action: (editor: Editor) => void,
  causesChange: boolean = true
) => {
  it(name, async () => {
    const fixedInput = deepFix(input);
    const fixedOutput = deepFix(output);
    const editor = getEditor(
      {
        withFormatting: true,
        withURLLinks: true,
        withKenchiElements: {},
        withCollapsible: true,
        variables: [],
      },
      null,
      fixedInput
    );

    let changed = false;
    editor.onChange = () => (changed = true);
    action(editor);
    if (causesChange) {
      await waitFor(() => expect(changed).toBe(true));
    } else {
      // Wait long enough that we probably would've registered a change
      await waitTimeDoNotUse(50);
    }

    expect(editor.children).toEqual(fixedOutput.children);
    expect(editor.selection).toEqual(fixedOutput.selection);
  });
};
