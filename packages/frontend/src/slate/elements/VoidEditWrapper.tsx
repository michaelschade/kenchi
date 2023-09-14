import { css } from '@emotion/react';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';

export type VoidEditWrapperOptions = {
  shouldBlockPointerEvents?: boolean;
};

type VoidEditWrapperType = {
  attributes?: Record<string, any>;
  children: React.ReactNode;
  voidElement: React.ReactNode;
  options?: VoidEditWrapperOptions;
};

const voidStyle = css`
  display: inline-block;
  width: calc(100% - 2px);
  position: relative;

  &.vdd-added,
  &.vdd-removed,
  &.vdd-modified,
  .vdd-added &,
  .vdd-removed &,
  .vdd-modified & {
    padding: 0.25rem;
  }
`;

export default function VoidEditWrapper({
  attributes = {},
  children,
  voidElement,
  options = { shouldBlockPointerEvents: true },
}: VoidEditWrapperType) {
  const { shouldBlockPointerEvents } = options;

  return (
    <div {...attributes} css={voidStyle}>
      <div
        contentEditable={false}
        css={({ colors }: KenchiTheme) => css`
          caret-color: transparent;
        `}
      >
        {shouldBlockPointerEvents && (
          <div
            style={{
              display: 'block',
              position: 'absolute',
              top: '0',
              left: '0',
              height: '100%',
              width: '100%',
              cursor: 'default',
              zIndex: 1,
            }}
          />
        )}
        <div style={{ position: 'relative' }}>{voidElement}</div>
      </div>
      {children}
    </div>
  );
}
