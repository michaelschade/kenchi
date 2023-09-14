import { css } from '@emotion/react';
import styled from '@emotion/styled';

const style = css`
  font-size: 0.8rem;

  p {
    font-size: 0.85rem;
  }

  .row:not(:last-child) {
    margin-bottom: 10px;
  }

  .row > div:first-of-type {
    padding-right: 0;
  }
`;

const ShortcutRow = styled.div`
  display: flex;
  flex: 0 0;
  margin-bottom: 10px;
`;

const KeyColumn = styled.div`
  line-height: 2;
  padding-right: 0;
  text-align: right;
  flex-basis: 40%;
  margin-right: 10px;
`;

export const Key = styled.span`
  cursor: default;
  user-select: none;
  padding: 2px 5px;
  border-radius: 5px;
  border: 1px solid ${({ theme: { colors } }) => colors.gray[6]};
  background: ${({ theme: { colors } }) => colors.gray[0]};
  box-shadow: 1px 1px 0px 0px ${({ theme: { colors } }) => colors.gray[8]};
  color: ${({ theme: { colors } }) => colors.gray[11]};
  font-weight: 500;
`;

const Description = styled.div`
  padding-top: 3px;
  font-size: 0.9rem;
  color: #463d46;
  flex-basis: 65%;
`;

const KEY_CHARS: Record<string, string> = {
  up: '↑',
  down: '↓',
  shift: '⇧',
  enter: '↵',
};

const HOTKEY_DESCRIPTIONS = [
  ['ctrl+␣', 'Quickly open Kenchi on any website'],
  ['ctrl+shift+␣', 'Hide Kenchi'],
  ['esc', 'Go back or close Kenchi'],
  ['up', 'Select previous item in list'],
  ['down', 'Select next item in list'],
  ['enter', 'Open or run the selected item'],
  ['shift+enter', 'Open/preview the selected item'],
  ['e', 'Edit the selected item'],
  ['h', 'Go to home page'],
  ['n', 'Create new snippet or playbook'],
  ['/', 'Search for a snippet, playbook, or collection'],
  ['x', 'Expand or collapse the current section'],
  ['shift+x', 'Expand or collapse all sections'],
  ['?', 'Open shortcuts guide'],
];

export default function HotkeysHelp() {
  const keys = HOTKEY_DESCRIPTIONS.map(([keys, description]) => {
    // Does not handle chained commands (e.g. `ctrl+k ctrl+e`) properly. This
    // splits each key combo into its own <Key> element for styling.
    const splitKeys = keys
      .split('+')
      .map((key) => [' ', <Key key={key}>{KEY_CHARS[key] || key}</Key>])
      .flat()
      .slice(1);
    return (
      <ShortcutRow key={keys}>
        <KeyColumn>{splitKeys}</KeyColumn>
        <Description>{description}</Description>
      </ShortcutRow>
    );
  });

  return (
    <div css={style}>
      <p className="text-dark">
        Kenchi is built to be keyboard-driven, so every page has its own special
        shortcuts. Speed up your workflow with these quick commands:
      </p>
      {keys}
    </div>
  );
}
