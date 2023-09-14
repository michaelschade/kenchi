import React from 'react';

import { css } from '@emotion/react';

import { HoverCard } from '@kenchi/ui/lib/Dashboard/HoverCard';
import { Separator } from '@kenchi/ui/lib/Dashboard/Separator';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import { VersionedNodeHoverCardFrontmatter } from '../components/VersionedNodeHoverCardFrontmatter';
import { ToolFragment } from '../graphql/generated';
import { truncatedPreviewStyle } from './ToolPreviewTooltip';
import useRunTool from './useRunTool';
import useTool from './useTool';

type ToolHoverCardProps = {
  children: React.ReactNode;
  toolId: string;
};

const Content = ({ toolId }: { toolId: string }) => {
  const { loading, error, tool } = useTool(toolId, 'cache-first');
  if (loading) {
    return <LoadingSpinner />;
  }
  if (error || !tool) {
    return null;
  }

  return (
    <div
      css={css`
        display: grid;
        gap: 0.5rem;
        align-items: center;
      `}
    >
      <VersionedNodeHoverCardFrontmatter versionedNode={tool} />
      <Separator />
      <ToolPreview tool={tool} />
    </div>
  );
};

const ToolPreview = ({ tool }: { tool: ToolFragment }) => {
  const [, { getPreview }] = useRunTool(tool, {});
  return (
    <div
      css={css`
        font-size: 0.8rem;
      `}
    >
      <div css={truncatedPreviewStyle}>{getPreview()}</div>
    </div>
  );
};

export const ToolHoverCard = ({ children, toolId }: ToolHoverCardProps) => {
  return (
    <HoverCard content={<Content toolId={toolId} />}>{children}</HoverCard>
  );
};
