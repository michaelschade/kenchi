import {
  blackA,
  blue,
  blueDark,
  green,
  greenDark,
  indigo,
  indigoA,
  indigoDark,
  indigoDarkA,
  red,
  redDark,
  slate,
  slateDark,
} from '@radix-ui/colors';

const slateDark0 = 'rgb(10, 11, 12)';

export const BrandColors = {
  periwinkle: 'hsl(233, 100%, 88%)',
  grey: 'hsl(216, 5%, 63%)',
  chartreuse: 'hsl(72, 41%, 52%)',
  black: 'hsl(300, 58%, 5%)',
  white: '#FFFFFF',
  periwinkleLight: 'hsl(231, 100%, 96%)',
};

// These colors don't change with the theme.
const fixedColors = {
  dialogOverlay: blackA.blackA9,
  gray: {
    3: slate.slate3,
    11: slate.slate11,
  },
  white: '#FFFFFF',
};

const specialColorsDark = {
  topBarButtonBorderColor: slateDark.slate7,
};

const specialColorsLight = {
  topBarButtonBorderColor: 'transparent',
};

export const lightTheme = {
  name: 'light',
  colors: {
    fixed: { ...fixedColors },
    special: { ...specialColorsLight },
    logomark: BrandColors.black,
    subtleShadow: blackA.blackA3,
    toastShadow: blackA.blackA8,
    extensionSectionHeader: `linear-gradient(20deg, hsl(300, 5%, 25%) 0%, ${slate.slate11})`,
    green: {
      1: green.green1,
      6: green.green6,
      9: green.green9,
      10: green.green10,
      11: green.green11,
    },
    blue: {
      9: blue.blue9,
      11: blue.blue11,
    },
    red: {
      6: red.red6,
      9: red.red9,
    },
    accent: {
      1: indigo.indigo1,
      2: indigo.indigo2,
      3: indigo.indigo3,
      4: indigo.indigo4,
      5: indigo.indigo5,
      6: indigo.indigo6,
      7: indigo.indigo7,
      8: indigo.indigo8,
      9: indigo.indigo9,
      10: indigo.indigo10,
      11: indigo.indigo11,
      12: indigo.indigo12,
    },
    accentWithAlpha: {
      5: indigoA.indigoA5,
    },
    gray: {
      0: '#ffffff',
      1: slate.slate1,
      2: slate.slate2,
      3: slate.slate3,
      4: slate.slate4,
      5: slate.slate5,
      6: slate.slate6,
      7: slate.slate7,
      8: slate.slate8,
      9: slate.slate9,
      10: slate.slate10,
      11: slate.slate11,
      12: slate.slate12,
      13: '#000000',
    },
  },
};

export const darkTheme = {
  name: 'dark',
  colors: {
    fixed: { ...fixedColors },
    special: { ...specialColorsDark },
    logomark: BrandColors.periwinkle,
    subtleShadow: blackA.blackA3,
    extensionSectionHeader: `linear-gradient(20deg, ${BrandColors.periwinkle} 0%, ${slateDark.slate11})`,
    green: {
      1: greenDark.green1,
      6: greenDark.green6,
      9: greenDark.green9,
      10: greenDark.green10,
      11: greenDark.green11,
    },
    blue: {
      9: blueDark.blue9,
      11: blueDark.blue11,
    },
    red: {
      6: redDark.red6,
      9: redDark.red9,
    },
    accent: {
      1: indigoDark.indigo1,
      2: indigoDark.indigo2,
      3: indigoDark.indigo3,
      4: indigoDark.indigo4,
      5: indigoDark.indigo5,
      6: indigoDark.indigo6,
      7: indigoDark.indigo7,
      8: indigoDark.indigo8,
      9: indigoDark.indigo9,
      10: indigoDark.indigo10,
      11: indigoDark.indigo11,
      12: indigoDark.indigo12,
    },
    accentWithAlpha: {
      5: indigoDarkA.indigoA5,
    },
    gray: {
      0: slateDark0,
      1: slateDark.slate1,
      2: slateDark.slate2,
      3: slateDark.slate3,
      4: slateDark.slate4,
      5: slateDark.slate5,
      6: slateDark.slate6,
      7: slateDark.slate7,
      8: slateDark.slate8,
      9: slateDark.slate9,
      10: slateDark.slate10,
      11: slateDark.slate11,
      12: slateDark.slate12,
      13: '#ffffff',
    },
  },
};

// We must override the default type of Theme, which is an empty object.
// See https://emotion.sh/docs/typescript#define-a-theme
export type KenchiTheme = typeof lightTheme & typeof darkTheme;
declare module '@emotion/react' {
  export interface Theme extends KenchiTheme {}
}

export const PageColors = {
  pageBackground: indigo.indigo1,
  // If you load non-dashboard app pages in a full window (rather than the
  // extension), we want a background for the extension
  extensionFullBackground: indigo.indigo2,
  // If you want to change this also change it in scripts/hud/index.ts
  extensionBackground: '#fafbff',
};

export const BaseColors = {
  info: 'hsla(211, 100%, 50%, 1)',
  secondary: 'hsla(210, 30%, 40%, 1)',
  success: 'hsla(153, 57%, 45%, 1)',
  warning: 'hsla(39, 95%, 50%, 1)',
  error: 'hsla(331, 57%, 50%, 1)',
};
