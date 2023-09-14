import { Editor } from 'slate';

import { test } from './testHelpers';
import { toggleActive } from './withCollapsible';

test(
  'Collapsibles have at least 2 lines',
  <editor>
    <p>
      ABC
      <cursor />
    </p>
    <p>
      <text />
    </p>
  </editor>,
  <editor>
    <block type="collapsible" id={expect.any(String)}>
      <p>
        ABC
        <cursor />
      </p>
      <p>
        <text />
      </p>
    </block>
    <p>
      <text />
    </p>
  </editor>,
  (editor) => {
    toggleActive(editor);
    Editor.normalize(editor);
  }
);

test(
  'Collapsible list items have at least 2 lines',
  <editor>
    <ul>
      <li>
        <p>
          ABC
          <cursor />
        </p>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <block type="collapsible-list-item" id={expect.any(String)}>
        <p>
          ABC
          <cursor />
        </p>
        <p>
          <text />
        </p>
      </block>
    </ul>
  </editor>,
  (editor) => {
    toggleActive(editor);
    Editor.normalize(editor);
  }
);

test(
  'Collapsibles always have a block after them',
  <editor>
    <p>
      <anchor />
      ABC
    </p>
    <p>
      DEF
      <focus />
    </p>
  </editor>,
  <editor>
    <block type="collapsible" id={expect.any(String)}>
      <p>
        <anchor />
        ABC
      </p>
      <p>
        DEF
        <focus />
      </p>
    </block>
    <p>
      <text />
    </p>
  </editor>,
  (editor) => {
    toggleActive(editor);
    Editor.normalize(editor);
  }
);

test(
  'Making multiple list items collapsible indents them',
  <editor>
    <ul>
      <li>
        <p>
          <anchor />
          ABC
        </p>
      </li>
      <li>
        <p>
          DEF
          <focus />
        </p>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <block type="collapsible-list-item" id={expect.any(String)}>
        <p>
          <text />
          <cursor />
        </p>
        <ul>
          <li>
            <p>ABC</p>
          </li>
          <li>
            <p>DEF</p>
          </li>
        </ul>
      </block>
    </ul>
  </editor>,
  (editor) => {
    toggleActive(editor);
    Editor.normalize(editor);
  }
);

test(
  'Removing a collapsible removes empty block after it',
  <editor>
    <block type="collapsible" id="abc">
      <p>
        <cursor />
        ABC
      </p>
      <p>
        <text />
      </p>
    </block>
  </editor>,
  <editor>
    <p>
      <cursor />
      ABC
    </p>
  </editor>,
  (editor) => {
    toggleActive(editor);
    Editor.normalize(editor);
  }
);

test(
  'Backspacing out of a collapsible list splits it',
  <editor>
    <ul>
      <block type="collapsible-list-item" id="abc">
        <p>ABC</p>
        <p>DEF</p>
        <p>
          <cursor />
          GHI
        </p>
        <p>JKL</p>
      </block>
    </ul>
  </editor>,
  <editor>
    <ul>
      <block type="collapsible-list-item" id="abc">
        <p>ABC</p>
        <p>DEF</p>
      </block>
    </ul>
    <p>
      <cursor />
      GHI
    </p>
    <ul>
      <li>
        <p>JKL</p>
      </li>
    </ul>
  </editor>,
  (editor) => {
    editor.deleteBackward('character');
  }
);

test(
  'Backspacing out of a collapsible removes it',
  <editor>
    <block type="collapsible" id="abc">
      <p>
        <cursor />
        ABC
      </p>
      <p>DEF</p>
    </block>
  </editor>,
  <editor>
    <p>
      <cursor />
      ABC
    </p>
    <p>DEF</p>
  </editor>,
  (editor) => {
    editor.deleteBackward('character');
  }
);
