import { css, Global } from '@emotion/react';
import { globalStyles } from 'twin.macro';

import NeueMachinaLight from '@kenchi/ui/fonts/PPNeueMachina-Light.woff2';
import NeueMachinaRegular from '@kenchi/ui/fonts/PPNeueMachina-Regular.woff2';
import UIGlobalStyles from '@kenchi/ui/lib/GlobalStyles';

// If you want any styles to appear everywhere stick them in this list:
const customGlobalStyles = css`
  @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;1,300;1,400&display=swap');

  @font-face {
    font-family: 'Neue Machina';
    src: url(${NeueMachinaLight}) format('woff2');
    font-style: normal;
    font-weight: 300;
  }

  @font-face {
    font-family: 'Neue Machina';
    src: url(${NeueMachinaRegular}) format('woff2');
    font-style: normal;
    font-weight: 400;
  }
`;

export default function GlobalStyles() {
  return (
    <>
      <UIGlobalStyles globalStyles={globalStyles} />
      <Global styles={customGlobalStyles} />
    </>
  );
}
