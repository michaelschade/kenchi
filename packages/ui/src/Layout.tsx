import { css } from '@emotion/react';
import styled from '@emotion/styled';

import { KenchiTheme } from './Colors';

/* Layout containers */

const pageBackground = ({ colors }: KenchiTheme) => css`
  background: ${colors.gray[2]};
`;

const extensionBackground = ({ colors }: KenchiTheme) => css`
  background: ${colors.gray[2]};
`;

const baseLayout = css`
  overflow-wrap: break-word;
  position: absolute;
  width: 100%;
  min-height: 100%;
  height: auto !important; /* cross-browser */
  height: 100%; /* cross-browser */
  --footer-height: 6rem;

  #app {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
  }

  /* TODO: Remove once we reset .row usage from Bootstrap */
  .row {
    width: 100%;
    margin: 0;
  }
`;

const emulateExtensionStyle = ({ colors }: KenchiTheme) => css`
  #app {
    background: ${colors.gray[1]};
    position: relative;
    margin: 20px auto;
    width: 300px;
    min-height: calc(100vh - 40px);
    border: 1px solid ${colors.gray[5]};
    box-shadow: 0px 0px 9px -4px ${colors.subtleShadow};
  }
`;

const ExtensionContainer = ({
  emulateExtension,
  children,
}: {
  emulateExtension: boolean;
  children: React.ReactNode;
}) => {
  const css = [];
  css.push(baseLayout);
  if (emulateExtension) {
    css.push(pageBackground, emulateExtensionStyle);
  } else {
    css.push(extensionBackground);
  }
  return <div css={css}>{children}</div>;
};

type ExtensionLayoutProps = {
  children: React.ReactNode;
  emulateExtension: boolean;
  hasFooter: boolean;
};

// It's...unorthodox to pass in the actually NeedsUpdate and Footer components,
// but it's the easiest way to get our wrapped lazy loading working without
// having to split it across multiple files.
export const ExtensionLayout = ({
  children,
  emulateExtension,
  hasFooter,
}: ExtensionLayoutProps) => {
  return (
    <ExtensionContainer emulateExtension={emulateExtension}>
      <div
        id="app"
        style={hasFooter ? { paddingBottom: 'var(--footer-height)' } : {}}
      >
        {children}
      </div>
    </ExtensionContainer>
  );
};

/* Content containers */

export const ContentContainer = styled.div`
  padding: 15px;
  width: 100%;
`;
