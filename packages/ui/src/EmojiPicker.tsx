import 'emoji-mart/css/emoji-mart.css';

import { useEffect, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NimblePicker, NimblePickerProps } from 'emoji-mart';
import fullEmojiData from 'emoji-mart/data/twitter.json';
// @ts-ignore
import { uncompress } from 'emoji-mart/dist/utils/data';
import tw from 'twin.macro';

import { KenchiTheme } from './Colors';
import { MenuOpener } from './DropdownMenu';
import Emoji, { shouldUseNativeEmoji } from './Emoji';
import { baseFormControl } from './Form';

type PickerProps = {
  id?: string;
  initialEmoji?: string;
  fallbackIcon?: IconDefinition;
  onSelect: (emoji: any) => void;
  style?: React.CSSProperties;
};

const PickerWrapper = styled.div`
  .emoji-mart {
    width: 100% !important;
    border: none;
    background: transparent;
  }

  .emoji-mart-search {
    margin-bottom: 0.25rem;
    input {
      background-color: ${({ theme }) => theme.colors.gray[1]};
      border: 1px solid ${({ theme }) => theme.colors.gray[6]};
      color: ${({ theme }) => theme.colors.gray[12]};
    }
  }

  .emoji-mart-search-icon {
    align-items: center;
    display: flex;
    top: 50%;
    transform: translateY(-50%);
    svg {
      fill: ${({ theme }) => theme.colors.gray[12]};
    }
  }

  .emoji-mart-category-label span {
    background-color: ${({ theme }) => theme.colors.gray[6]};
    font-size: 0.8em;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    color: ${({ theme }) => theme.colors.gray[11]};
  }

  .emoji-mart-category-list {
    margin-top: 0.25rem;

    & li:focus,
    & button:focus {
      outline: none;
    }
  }

  .emoji-mart-emoji span {
    cursor: pointer !important;
  }
`;

// Need to check compressed to avoid hot reload issues
if (fullEmojiData.compressed) {
  uncompress(fullEmojiData as any);
}

const initialEmojiData = {
  ...fullEmojiData,
  categories: fullEmojiData.categories.map((c) =>
    c.id === 'people'
      ? { ...c, emojis: c.emojis.slice(0, 56) }
      : { ...c, emojis: [] }
  ),
};

export function Picker({ initialEmoji, onSelect }: PickerProps) {
  const [fullPicker, setFullPicker] = useState(false);

  useEffect(() => {
    // The picker and rc-trigger interact poorly: rc-trigger runs reflow
    // calculations a lot, and the picker renders every emoji in a single list,
    // which takes a long time to calculate. To solve this we render a picker
    // with fewer elements so that the initial menu looks right, then swap it
    // out for the full picker. A little hacky but it works well.
    window.setTimeout(() => setFullPicker(true), 0);
  }, []);

  const pickerProps: Omit<NimblePickerProps, 'data'> = {
    autoFocus: true,
    title: '',
    emojiSize: 20,
    sheetSize: 64,
    native: shouldUseNativeEmoji(),
    set: 'twitter',
    showPreview: false,
    showSkinTones: false /* allows us to remove footer entirely */,
    onSelect: (emoji) => onSelect((emoji as any).native),
    color: '#b300aa',
    perLine: 7,
  };

  return (
    <PickerWrapper>
      {[
        // Picker only looks at data on initial render, so we have to force a new
        // picker to render to get a different emoji list.
        fullPicker && (
          <NimblePicker
            key="full"
            data={fullEmojiData as any}
            {...pickerProps}
          />
        ),
        !fullPicker && (
          <NimblePicker
            key="initial"
            data={initialEmojiData as any}
            {...pickerProps}
          />
        ),
      ]}
    </PickerWrapper>
  );
}

export function InlineEmojiPicker({
  id,
  initialEmoji,
  fallbackIcon,
  onSelect,
  style = {},
}: PickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const button = (
    <button
      type="button"
      css={css`
        background-color: transparent;
        outline: none;
        border: 1px solid transparent;
        border-radius: 0.25rem;
        transition: 150ms box-shadow ease-in-out, 150ms border-color ease-in-out;
        ${isOpen ? tw`border-gray-300` : ''}
        &:hover {
          ${tw`border-gray-300`}
        }
        &:focus-visible {
          border-color: hsl(211deg 100% 75%);
          box-shadow: 0 0 0 0.2rem hsl(211deg 100% 50% / 25%);
        }
      `}
    >
      {initialEmoji && <Emoji emoji={initialEmoji} />}
      {!initialEmoji && fallbackIcon && (
        <FontAwesomeIcon
          icon={fallbackIcon}
          size="sm"
          css={({ colors }: KenchiTheme) =>
            css`
              color: ${colors.gray[7]};
            `
          }
          fixedWidth
        />
      )}
    </button>
  );
  return (
    <MenuOpener
      onOpenChange={setIsOpen}
      open={isOpen}
      menuContent={
        <Picker
          initialEmoji={initialEmoji}
          onSelect={(emoji) => {
            onSelect(emoji);
            setIsOpen(false);
          }}
        />
      }
      css={css`
        width: 250px;
        position: relative;
        padding: 0;
      `}
    >
      {button}
    </MenuOpener>
  );
}

export function PickerButton({
  id,
  initialEmoji,
  onSelect,
  style = {},
}: PickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const button = (
    <button
      type="button"
      id={id}
      css={baseFormControl}
      className={isOpen ? 'active' : ''}
      onMouseDown={(e) => e.stopPropagation()}
      style={Object.assign({ width: '42px' }, style)}
    >
      {initialEmoji ? <Emoji emoji={initialEmoji} /> : <>&nbsp;</>}
    </button>
  );
  return (
    <MenuOpener
      onOpenChange={setIsOpen}
      open={isOpen}
      menuContent={
        <Picker
          initialEmoji={initialEmoji}
          onSelect={(emoji) => {
            onSelect(emoji);
            setIsOpen(false);
          }}
        />
      }
      css={css`
        width: 250px;
        position: relative;
        right: 5px;
        padding: 0;
      `}
    >
      {button}
    </MenuOpener>
  );
}
