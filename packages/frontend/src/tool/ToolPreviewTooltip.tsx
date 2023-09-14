import { css } from '@emotion/react';

import Tooltip, { TooltipProps } from '@kenchi/ui/lib/Tooltip';

export const truncatedPreviewStyle = css`
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;

  .url {
    word-break: break-all;
  }

  ol,
  li {
    margin-bottom: 0;
  }
  p {
    margin-bottom: 0;
  }
  p:empty {
    height: 1em;
  }
`;

export default function ToolPreviewTooltip({
  name,
  previewContents,
  children,
  isOpen,
}: {
  name: string;
  previewContents: React.ReactNode;
  children: React.ReactNode;
} & TooltipProps) {
  let overlay = undefined;
  if (previewContents) {
    overlay = (
      <div css={truncatedPreviewStyle}>
        <em>{name}</em>
        {previewContents}
      </div>
    );
  }
  return (
    // We omit onOpenChange because we need to manually control the isOpen state
    // to prevent the tooltip from remaining open in front of a dialog that's a
    // React child of the tooltip triggger.
    <Tooltip isOpen={isOpen} overlay={overlay}>
      {children}
    </Tooltip>
  );
}
