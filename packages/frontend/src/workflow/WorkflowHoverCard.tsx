import React from 'react';

import { css } from '@emotion/react';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { HoverCard } from '@kenchi/ui/lib/Dashboard/HoverCard';
import { Separator } from '@kenchi/ui/lib/Dashboard/Separator';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import { VersionedNodeHoverCardFrontmatter } from '../components/VersionedNodeHoverCardFrontmatter';
import { PreviewRenderer } from '../slate/Renderer';
import { truncatedPreviewStyle } from '../tool/ToolPreviewTooltip';
import useWorkflow from './useWorkflow';

type WorkflowHoverCardProps = {
  children: React.ReactNode;
  workflowId: string;
};

const Content = ({ workflowId }: { workflowId: string }) => {
  const { loading, error, workflow } = useWorkflow(workflowId, 'cache-first');
  if (loading) {
    return <LoadingSpinner />;
  }
  if (error || !workflow) {
    return null;
  }

  return (
    <div
      css={css`
        display: grid;
        gap: 0.5rem;
        // Sometimes <PreviewRenderer/> ends up overflowing. I'm not sure why.
        // This overflow: hidden; is a hack fix.
        overflow: hidden;
      `}
    >
      <VersionedNodeHoverCardFrontmatter versionedNode={workflow} />
      <Separator />
      <div
        css={({ colors }: KenchiTheme) => css`
          font-size: 0.8rem;
          overflow: hidden;

          // This max-height is a hack to prevent workflows with embedded
          // workflows from sneaking around the maxLength prop on
          // PreviewRenderer.
          // TODO: make that option smarter.
          max-height: 8rem;

          // Prevent interaction with elements in the preview, like embedded
          // snippets. Buggy stuff happens if we don't do this.
          pointer-events: none;
        `}
      >
        <div css={truncatedPreviewStyle}>
          <PreviewRenderer
            // We set a higher maxLength here than what we actually want, and
            // instead clip the length with line-clamp, which comes from
            // previewToolTipStyle
            maxLength={500}
            contents={workflow.contents}
            showMore={false}
          />
        </div>
      </div>
    </div>
  );
};

export const WorkflowHoverCard = ({
  children,
  workflowId,
}: WorkflowHoverCardProps) => {
  return (
    <HoverCard content={<Content workflowId={workflowId} />}>
      {children}
    </HoverCard>
  );
};
