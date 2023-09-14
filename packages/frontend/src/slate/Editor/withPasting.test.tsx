import { Editor } from 'slate';

import { fromHTML } from '@kenchi/slate-tools/lib/fromHTML';

import { deepFix, test } from './testHelpers';

const pasteFragment = (fragment: JSX.Element) => (editor: Editor) =>
  editor.insertFragment(deepFix(fragment));

const pasteHTML =
  (html: string, doubleParagraphs = false) =>
  (editor: Editor) => {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const fragment = fromHTML(parsed.body, {
      splitOnBr: false,
      onImage: () => true,
      doubleParagraphs,
    });
    editor.insertFragment(fragment);
  };

test(
  'Pasting a list on an empty line',
  <editor>
    <p>
      <cursor />
    </p>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>ABC</p>
      </li>
      <li>
        <p>
          DEF
          <cursor />
        </p>
      </li>
    </ul>
  </editor>,
  pasteFragment(
    <fragment>
      <ul>
        <li>
          <p>ABC</p>
        </li>
        <li>
          <p>DEF</p>
        </li>
      </ul>
    </fragment>
  )
);

test(
  'Pasting a list on a line with text',
  <editor>
    <p>
      GHI
      <cursor />
    </p>
  </editor>,
  <editor>
    <p>GHIABC</p>
    <ul>
      <li>
        <p>
          DEF
          <cursor />
        </p>
      </li>
    </ul>
  </editor>,
  pasteFragment(
    <fragment>
      <ul>
        <li>
          <p>ABC</p>
        </li>
        <li>
          <p>DEF</p>
        </li>
      </ul>
    </fragment>
  )
);

test(
  'Pasting a list onto the end of another list',
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
        <p>ABCDEF</p>
      </li>
      <li>
        <p>
          GHI
          <cursor />
        </p>
      </li>
    </ul>
  </editor>,
  pasteFragment(
    <fragment>
      <ul>
        <li>
          <p>DEF</p>
        </li>
        <li>
          <p>GHI</p>
        </li>
      </ul>
    </fragment>
  )
);

test(
  'Pasting a list onto the end of another list at beginning of line',
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
        <p>DEF</p>
      </li>
      <li>
        <p>
          GHI
          <cursor />
          ABC
        </p>
      </li>
    </ul>
  </editor>,
  pasteFragment(
    <fragment>
      <ul>
        <li>
          <p>DEF</p>
        </li>
        <li>
          <p>GHI</p>
        </li>
      </ul>
    </fragment>
  )
);

test(
  'Pasting a list onto the end of another list with additional blocks',
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
        <p>ABCDEF</p>
      </li>
      <li>
        <p>GHI</p>
      </li>
    </ul>
    <ol>
      <li>
        <p>
          JKL
          <cursor />
        </p>
      </li>
    </ol>
  </editor>,
  pasteFragment(
    <fragment>
      <ul>
        <li>
          <p>DEF</p>
        </li>
        <li>
          <p>GHI</p>
        </li>
      </ul>
      <ol>
        <li>JKL</li>
      </ol>
    </fragment>
  )
);

test(
  'Pasting a link from Notion',
  <editor>
    <p>
      <cursor />
    </p>
  </editor>,
  <editor>
    <p>
      Here is text{' '}
      <block type="link" url="https://example.com">
        with a link
      </block>{' '}
      and more text
      <cursor />
    </p>
  </editor>,
  pasteHTML(
    `<meta charset='utf-8'>Here is text <a href="https://example.com" style="cursor:pointer;color:inherit;word-wrap:break-word;text-decoration:inherit" class="notion-link-token notion-enable-hover" target="_blank" rel="noopener noreferrer" data-token-index="1" data-reactroot=""><span style="border-bottom:0.05em solid;border-color:rgba(55,53,47,0.4);opacity:0.7">with a link</span></a> and more text`
  )
);

test(
  'Pasting a list from HTML',
  <editor>
    <p>
      <cursor />
    </p>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>List item 1</p>
      </li>
      <li>
        <p>
          List item 2<cursor />
        </p>
      </li>
    </ul>
  </editor>,
  pasteHTML(
    `<ul>
      <li>List item 1</li>
      <li>List item 2</li>
    </ul>`
  )
);

test(
  'Pasting code tag',
  <editor>
    <p>
      <cursor />
    </p>
  </editor>,
  <editor>
    <p>
      {/* @ts-ignore text conflicts with SVGTextElement */}
      Hello <text code={true}>world</text>
      <cursor />
    </p>
  </editor>,
  pasteHTML(`<p>Hello <code>world</code></p>`)
);

test(
  'Pasting a list with a link',
  <editor>
    <p>
      <cursor />
    </p>
  </editor>,
  <editor>
    <ul>
      <li>
        <p>
          {/* Not sure why there are these empty text blocks, but they're harmless... */}
          <text />
          <block type="link" url="https://example.com">
            with a link
            <cursor />
          </block>
          <text />
        </p>
      </li>
    </ul>
  </editor>,
  pasteHTML(`<ul><li><a href="https://example.com">with a link</a></li></ul>`)
);

test(
  'Pasting from gmail has proper line breaks in playbooks',
  <editor>
    <p>
      <cursor />
    </p>
  </editor>,
  <editor>
    <p>Test 1</p>
    <p>Test 2</p>
    <p>
      Test 3<cursor />
    </p>
  </editor>,
  pasteHTML(
    `
      <meta charset='utf-8'>
      <span style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;">Test 1</span>
      <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;"><br></div>
      <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">Test 2</div>
      <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;"><br></div>
      <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">Test 3</div>
    `,
    false
  )
);

test(
  'Pasting from gmail has proper line breaks in snippets',
  <editor>
    <p>
      <cursor />
    </p>
  </editor>,
  <editor>
    <p>Test 1</p>
    <p>
      <text />
    </p>
    <p>Test 2</p>
    <p>
      <text />
    </p>
    <p>
      Test 3<cursor />
    </p>
  </editor>,
  pasteHTML(
    `
      <meta charset='utf-8'>
      <span style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;">Test 1</span>
      <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;"><br></div>
      <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">Test 2</div>
      <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;"><br></div>
      <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">Test 3</div>
    `,
    true
  )
);
