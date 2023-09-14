import { css } from '@emotion/react';

// See https://github.com/twitter/twemoji/blob/8017ebd412a6293993aa5c0709f0e035714b3cdd/scripts/build.js#L344

function grabTheRightIcon(rawText: string) {
  // if variant is present as \uFE0F
  return toCodePoint(
    rawText.indexOf('\u200D') < 0 ? rawText.replace(/\uFE0F/g, '') : rawText
  );
}

function toCodePoint(unicodeSurrogates: string, sep?: string) {
  var r = [],
    c = 0,
    p = 0,
    i = 0;
  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((0x10000 + ((p - 0xd800) << 10) + (c - 0xdc00)).toString(16));
      p = 0;
    } else if (0xd800 <= c && c <= 0xdbff) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join(sep || '-');
}

const emojiStyle = css`
  display: inline;
  width: 1em;
`;

export function shouldUseNativeEmoji() {
  return typeof navigator !== 'undefined' && navigator.platform === 'MacIntel';
}

type EmojiProps = {
  emoji: string | null | undefined;
  className?: string;
};

export default function Emoji({ emoji, className }: EmojiProps) {
  if (!emoji) {
    return null;
  }
  if (shouldUseNativeEmoji()) {
    return <span className={className}>{emoji}</span>;
  }
  return (
    <img
      src={`https://twemoji.maxcdn.com/v/13.0.1/72x72/${grabTheRightIcon(
        emoji
      )}.png`}
      css={emojiStyle}
      className={className}
      draggable={false}
      alt={emoji}
    />
  );
}
