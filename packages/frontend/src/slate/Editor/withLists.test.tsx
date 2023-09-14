import { Editor } from 'slate';

import { test } from './testHelpers';
import { onKeyDown, toggleList } from './withLists';

const pressShiftEnter = (editor: Editor) => editor.insertSoftBreak();
const pressEnter = (editor: Editor) => editor.insertBreak();
const pressShiftTab = (editor: Editor) => {
  onKeyDown(editor, {
    shiftKey: true,
    key: 'Tab',
    preventDefault: () => {},
  } as any);
};
const pressTab = (editor: Editor) => {
  onKeyDown(editor, { key: 'Tab', preventDefault: () => {} } as any);
};
const pressBackspace = (editor: Editor) => editor.deleteBackward('character');
const pressListButton = (editor: Editor) => toggleList(editor, 'bulleted-list');

test(
  'Newline adds another bullet',
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
      <li>
        <p>ABC</p>
      </li>
      <li>
        <p>
          <cursor />
        </p>
      </li>
    </ul>
  </editor>,
  pressEnter
);

test(
  'Newline from beginning of line moves content',
  <editor>
    <ul>
      <li>
        <p>
          <cursor />
          ABC
        </p>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>
          <text />
        </p>
      </li>
      <li>
        <p>
          <cursor />
          ABC
        </p>
      </li>
    </ul>
  </editor>,
  pressEnter
);

test(
  'Shift+newline adds new paragraph',
  <editor>
    <ul>
      <li>
        <p>
          ABC
          <cursor />
          DEF
        </p>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>ABC</p>
        <p>
          <cursor />
          DEF
        </p>
      </li>
    </ul>
  </editor>,
  pressShiftEnter
);

test(
  'Single bullet tab does nothing',
  <editor>
    <ul>
      <li>
        <p>
          <cursor />
          ABC
        </p>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>
          <cursor />
          ABC
        </p>
      </li>
    </ul>
  </editor>,
  pressTab,
  false
);

test(
  'Single bullet untab does nothing',
  <editor>
    <ul>
      <li>
        <p>
          <cursor />
          ABC
        </p>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>
          <cursor />
          ABC
        </p>
      </li>
    </ul>
  </editor>,
  pressShiftTab,
  false
);

test(
  'Second bullet tab',
  <editor>
    <ul>
      <li>
        <p>ABC</p>
      </li>
      <li>
        <p>
          <cursor />
          DEF
        </p>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>ABC</p>
        <ul>
          <li>
            <p>
              <cursor />
              DEF
            </p>
          </li>
        </ul>
      </li>
    </ul>
  </editor>,
  pressTab
);

test(
  'Second bullet untab',
  <editor>
    <ul>
      <li>
        <p>ABC</p>
        <ul>
          <li>
            <p>
              <cursor />
              DEF
            </p>
          </li>
        </ul>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>ABC</p>
      </li>
      <li>
        <p>
          <cursor />
          DEF
        </p>
      </li>
    </ul>
  </editor>,
  pressShiftTab
);

test(
  'Indenting bullet also indents sub-bullets',
  <editor>
    <ul>
      <li>
        <p>ABC</p>
      </li>
      <li>
        <p>
          <cursor />
          DEF
        </p>
        <ul>
          <li>
            <p>GHI</p>
          </li>
        </ul>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>ABC</p>
        <ul>
          <li>
            <p>
              <cursor />
              DEF
            </p>
            <ul>
              <li>
                <p>GHI</p>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </editor>,
  pressTab
);

test(
  'Unindenting bullet also unindents sub-bullets',
  <editor>
    <ul>
      <ul>
        <li>
          <p>
            <cursor />
            ABC
          </p>
          <ul>
            <li>
              <p>DEF</p>
            </li>
          </ul>
        </li>
      </ul>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>
          <cursor />
          ABC
        </p>
        <ul>
          <li>
            <p>DEF</p>
          </li>
        </ul>
      </li>
    </ul>
  </editor>,
  pressShiftTab
);

test(
  'Indenting second list item merges with previous sub-list',
  <editor>
    <ul>
      <li>
        <p>ABC</p>
        <ul>
          <li>
            <p>DEF</p>
          </li>
        </ul>
      </li>
      <li>
        <p>
          <cursor />
          GHI
        </p>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>ABC</p>
        <ul>
          <li>
            <p>DEF</p>
          </li>
          <li>
            <p>
              <cursor />
              GHI
            </p>
          </li>
        </ul>
      </li>
    </ul>
  </editor>,
  pressTab
);

test(
  'Unindenting second sub-list splits list',
  <editor>
    <ul>
      <li>
        <p>ABC</p>
        <ul>
          <li>
            <p>DEF</p>
          </li>
          <li>
            <p>
              <cursor />
              GHI
            </p>
          </li>
        </ul>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>ABC</p>
        <ul>
          <li>
            <p>DEF</p>
          </li>
        </ul>
      </li>
      <li>
        <p>
          <cursor />
          GHI
        </p>
      </li>
    </ul>
  </editor>,
  pressShiftTab
);

test(
  'Unindenting first sub-list leaves second sub-list',
  <editor>
    <ul>
      <li>
        <p>ABC</p>
        <ul>
          <li>
            <p>
              <cursor />
              DEF
            </p>
          </li>
          <li>
            <p>GHI</p>
          </li>
        </ul>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>ABC</p>
      </li>
      <li>
        <p>
          <cursor />
          DEF
        </p>
        <ul>
          <li>
            <p>GHI</p>
          </li>
        </ul>
      </li>
    </ul>
  </editor>,
  pressShiftTab
);

test(
  'Newline adds new list item after void wrapped element',
  <editor>
    <ul>
      <li>
        <block type="void-wrapper">
          <block type="void-spacer">
            <text />
          </block>
          <block type="tool">
            <text />
          </block>
          <block type="void-spacer">
            <text>
              <cursor />
            </text>
          </block>
        </block>
      </li>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <block type="void-wrapper">
          <block type="void-spacer">
            <text />
          </block>
          <block type="tool">
            <text />
          </block>
          <block type="void-spacer">
            <text />
          </block>
        </block>
      </li>
      <li>
        <p>
          <cursor />
        </p>
      </li>
    </ul>
  </editor>,
  pressEnter
);

test(
  'Appends void wrapped element to a list when backspacing onto a list',
  <editor>
    <ul>
      <li>
        <p>Hello</p>
      </li>
    </ul>
    <block type="void-wrapper">
      <block type="void-spacer">
        <text>
          <cursor />
        </text>
      </block>
      <block type="tool">
        <text />
      </block>
      <block type="void-spacer">
        <text />
      </block>
    </block>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>Hello</p>
        <block type="void-wrapper">
          <block type="void-spacer">
            <text>
              <cursor />
            </text>
          </block>
          <block type="tool">
            <text />
          </block>
          <block type="void-spacer">
            <text />
          </block>
        </block>
      </li>
    </ul>
  </editor>,
  pressBackspace
);

test(
  'Toggling list gives multiple paragraphs their own list item',
  <editor>
    <p>
      <anchor />
      Hello
    </p>
    <p>
      Goodbye
      <focus />
    </p>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>
          <anchor />
          Hello
        </p>
      </li>
      <li>
        <p>
          Goodbye
          <focus />
        </p>
      </li>
    </ul>
  </editor>,
  pressListButton
);

test(
  'Toggling list around existing list merges properly',
  <editor>
    <p>
      <anchor />
      Hello
    </p>
    <ul>
      <li>
        <p>Middle</p>
      </li>
    </ul>
    <p>
      Goodbye
      <focus />
    </p>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>
          <anchor />
          Hello
        </p>
      </li>
      <li>
        <p>Middle</p>
      </li>
      <li>
        <p>
          Goodbye
          <focus />
        </p>
      </li>
    </ul>
  </editor>,
  pressListButton
);

test(
  'Does not allow list without list item children',
  <editor>
    <ul>
      <ul>
        <li>
          <p>
            Yo
            <cursor />
          </p>
        </li>
      </ul>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>
          Y
          <cursor />
        </p>
      </li>
    </ul>
  </editor>,
  pressBackspace
);

test(
  'Does not allow non-list-item inside of list',
  <editor>
    <ul>
      <li>
        <p>Foo</p>
      </li>
      <p>
        Bar
        <cursor />
      </p>
    </ul>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>Foo</p>
      </li>
      <li>
        <p>
          Ba
          <cursor />
        </p>
      </li>
    </ul>
  </editor>,
  pressBackspace
);
