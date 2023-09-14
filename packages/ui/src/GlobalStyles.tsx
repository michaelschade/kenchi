import { useMemo } from 'react';

import { Global } from '@emotion/react';
import merge from 'lodash/merge';
import { globalStyles } from 'twin.macro'; // This gets replaced by a macro, be careful messing with it.

type PreflightStylesType = Record<string, Record<string, string | boolean>>;

// The two lists of styles we want to remove. See:
// https://github.com/ben-rogerson/twin.macro/blob/3071660f59e2d330720c6fee992a74b8aab35c11/src/config/preflightStyles.js
const modernNormalizeStyles: PreflightStylesType = {
  '*, ::before, ::after': { boxSizing: 'border-box' },
  html: {
    lineHeight: '1.15',
    WebkitTextSizeAdjust: '100%',
    MozTabSize: '4',
    tabSize: '4',
  },
  body: {
    margin: '0',
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'",
  },
  hr: { height: '0', color: 'inherit' },
  'abbr[title]': { textDecoration: 'underline dotted' },
  'b, strong': { fontWeight: 'bolder' },
  'code, kbd, samp, pre': {
    fontFamily:
      "ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
    fontSize: '1em',
  },
  small: { fontSize: '80%' },
  'sub, sup': {
    fontSize: '75%',
    lineHeight: '0',
    position: 'relative',
    verticalAlign: 'baseline',
  },
  sub: { bottom: '-0.25em' },
  sup: { top: '-0.5em' },
  table: { textIndent: '0', borderColor: 'inherit' },
  'button, input, optgroup, select, textarea': {
    fontFamily: 'inherit',
    fontSize: '100%',
    lineHeight: '1.15',
    margin: '0',
  },
  'button, select': { textTransform: 'none' },
  "button, [type='button'], [type='reset'], [type='submit']": {
    WebkitAppearance: 'button',
  },
  '::-moz-focus-inner': { borderStyle: 'none', padding: '0' },
  ':-moz-focusring': { outline: '1px dotted ButtonText' },
  ':-moz-ui-invalid': { boxShadow: 'none' },
  legend: { padding: '0' },
  progress: { verticalAlign: 'baseline' },
  '::-webkit-inner-spin-button, ::-webkit-outer-spin-button': {
    height: 'auto',
  },
  "[type='search']": { WebkitAppearance: 'textfield', outlineOffset: '-2px' },
  '::-webkit-search-decoration': { WebkitAppearance: 'none' },
  '::-webkit-file-upload-button': {
    WebkitAppearance: 'button',
    font: 'inherit',
  },
  summary: { display: 'list-item' },
};

const globalPreflightStyles: PreflightStylesType = {
  'blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre': {
    margin: '0',
  },
  button: { backgroundColor: 'transparent', backgroundImage: 'none' },
  // Css object styles can't have duplicate keys.
  // This means fallbacks can't be specified like they can in css.
  // Here we use a bogus `:not` for a different key without adding extra specificity.
  'button:focus:not(/**/)': {
    outline: '1px dotted',
  },
  'button:focus': {
    outline: '5px auto -webkit-focus-ring-color',
  },
  fieldset: { margin: '0', padding: '0' },
  'ol, ul': { listStyle: 'none', margin: '0', padding: '0' },
  html: {
    fontFamily: true, // used theme, so just strip anything
    lineHeight: '1.5',
  },
  body: { fontFamily: 'inherit', lineHeight: 'inherit' },
  '*, ::before, ::after': {
    boxSizing: 'border-box',
    borderWidth: '0',
    borderStyle: 'solid',
    borderColor: true, // used withAlpha, so just strip anything
  },
  hr: { borderTopWidth: '1px' },
  img: { borderStyle: 'solid' },
  textarea: { resize: 'vertical' },
  'input::placeholder, textarea::placeholder': {
    color: true, // used theme, so just strip anything
  },
  'button, [role="button"]': { cursor: 'pointer' },
  table: { borderCollapse: 'collapse' },
  'h1, h2, h3, h4, h5, h6': {
    fontSize: 'inherit',
    fontWeight: 'inherit',
  },
  a: { color: 'inherit', textDecoration: 'inherit' },
  'button, input, optgroup, select, textarea': {
    padding: '0',
    lineHeight: 'inherit',
    color: 'inherit',
  },
  'pre, code, kbd, samp': {
    fontFamily: true, // used theme, so just strip anything
  },
  'img, svg, video, canvas, audio, iframe, embed, object': {
    display: 'block',
    verticalAlign: 'middle',
  },
  'img, video': { maxWidth: '100%', height: 'auto' },
  '[hidden]': { display: 'none' },
};

const preflightStyles = merge({}, modernNormalizeStyles, globalPreflightStyles);

type GlobalStylesType = Record<string, Record<string, string>>;
type Props = { globalStyles: Record<string, unknown> };

// twin.macro generates a global style object based on what is actually used in
// the package. As a result the globalStyles in packages/ui and the one in the
// app can be different.
//
// Frustratingly, twin.macro also includes modern-normalize in this with no way
// to turn it off, so in addition to merging the style rules, we need to strip
// that out.
//
// We do a bunch of checking to make sure we're only removing the exact rules we
// don't want to err on the side of inclusion rather than exclusion.
const GlobalStyles = ({ globalStyles: localGlobalStyles }: Props) => {
  const styles = useMemo(() => {
    const styles = merge(
      {},
      globalStyles,
      localGlobalStyles
    ) as GlobalStylesType;
    const finalStyles: GlobalStylesType = {};
    Object.entries(styles).forEach(([selector, props]) => {
      const preflightProps = preflightStyles[selector] || {};
      const finalProps: Record<string, string> = {};
      Object.entries(props).forEach(([prop, value]) => {
        if (preflightProps[prop] !== true && preflightProps[prop] !== value) {
          finalProps[prop] = value;
        }
      });
      finalStyles[selector] = finalProps;
    });
    return finalStyles;
  }, [localGlobalStyles]);

  return <Global styles={styles} />;
};

export default GlobalStyles;
