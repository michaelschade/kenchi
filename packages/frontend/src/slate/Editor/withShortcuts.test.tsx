import { test } from './testHelpers';

const getInput = () => (
  <editor>
    <block>Hello</block>
    <block>
      <cursor />
    </block>
  </editor>
);

test(
  'Bulleted list shortcut',
  getInput(),
  <editor>
    <block>Hello</block>
    <ul>
      <li>
        <p>
          <cursor />
        </p>
      </li>
    </ul>
  </editor>,
  (editor) => {
    editor.insertText('*');
    editor.insertText(' ');
  }
);

test(
  'Numbered list shortcut',
  getInput(),
  <editor>
    <block>Hello</block>
    <ol>
      <li>
        <p>
          <cursor />
        </p>
      </li>
    </ol>
  </editor>,
  (editor) => {
    editor.insertText('1');
    editor.insertText('.');
    editor.insertText(' ');
  }
);

test(
  'Heading shortcut',
  getInput(),
  <editor>
    <block>Hello</block>
    <block type="heading">
      <cursor />
    </block>
  </editor>,
  (editor) => {
    editor.insertText('#');
    editor.insertText(' ');
  }
);
