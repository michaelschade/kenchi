import { css, Global } from '@emotion/react';

const style = css`
  body.kenchi-open.kenchi-left #root {
    margin-left: 300px;
    width: calc(100% - 300px);
  }

  body.kenchi-open.kenchi-right #root {
    margin-right: 300px;
    width: calc(100% - 300px);
  }
`;

export const InlineApp = () => <Global styles={style} />;
