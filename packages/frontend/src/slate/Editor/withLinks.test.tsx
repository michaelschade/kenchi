import { test } from './testHelpers';

test(
  'Insertion at end of link is not part of link',
  <editor>
    <p>
      <text />
      <block type="link" url="http://example.com">
        ABC
        <cursor />
      </block>
    </p>
  </editor>,
  <editor>
    <p>
      <text />
      <block type="link" url="http://example.com">
        ABC
      </block>
      D
      <cursor />
    </p>
  </editor>,
  (editor) => editor.insertText('D')
);

test(
  'Insertion at end of link with adjacent text is not part of link',
  <editor>
    <p>
      <text />
      <block type="link" url="http://example.com">
        ABC
        <cursor />
      </block>
      EFG
    </p>
  </editor>,
  <editor>
    <p>
      <text />
      <block type="link" url="http://example.com">
        ABC
      </block>
      D
      <cursor />
      EFG
    </p>
  </editor>,
  (editor) => editor.insertText('D')
);

test(
  'Insertion at end of link with formatting is not part of link',
  <editor>
    <p>
      <text />
      <block type="link" url="http://example.com">
        {/* @ts-ignore text conflicts with SVGTextElement */}
        <text bold={true}>
          ABC
          <cursor />
        </text>
      </block>
      EFG
    </p>
  </editor>,
  <editor>
    <p>
      <text />
      <block type="link" url="http://example.com">
        {/* @ts-ignore text conflicts with SVGTextElement */}
        <text bold={true}>ABC</text>
      </block>
      D
      <cursor />
      EFG
    </p>
  </editor>,
  (editor) => editor.insertText('D')
);

test(
  'Insert at end of link with sub-element is not part of link',
  <editor>
    <p>
      <text />
      <block type="link" url="http://example.com">
        A
        <block type="variable" id="id" source="input" placeholder="placeholder">
          <text />
        </block>
        <text />
        <cursor />
      </block>
      EFG
    </p>
  </editor>,
  <editor>
    <p>
      <text />
      <block type="link" url="http://example.com">
        A
        <block type="variable" id="id" source="input" placeholder="placeholder">
          <text />
        </block>
        <text />
      </block>
      D
      <cursor />
      EFG
    </p>
  </editor>,
  (editor) => editor.insertText('D')
);
