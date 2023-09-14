import React from 'react';

import { css } from '@emotion/react';
import { faFileInvoice } from '@fortawesome/pro-solid-svg-icons';

import { LinkPill } from '@kenchi/ui/lib/Dashboard/Pill';
import { NameWithEmoji } from '@kenchi/ui/lib/NameWithEmoji';
import { StyledLink } from '@kenchi/ui/lib/StyledLink';

import { ToolFragment, WorkflowFragment } from '../graphql/generated';
import { isWorkflow } from '../utils/versionedNode';

export const VersionedNodeHoverCardFrontmatter = ({
  versionedNode,
}: {
  versionedNode: ToolFragment | WorkflowFragment;
}) => {
  const { description, name, icon, collection, staticId } = versionedNode;
  const itemType = isWorkflow(versionedNode) ? 'playbook' : 'snippet';
  return (
    <>
      <div
        css={css`
          display: flex;
          padding-bottom: 0.25rem;
        `}
      >
        <LinkPill to={`/dashboard/collections/${collection.id}`}>
          {collection.name}
        </LinkPill>
      </div>
      <div
        css={css`
          font-size: 0.9rem;
          font-weight: 700;
        `}
      >
        <StyledLink to={`/dashboard/${itemType}s/${staticId}`}>
          <NameWithEmoji
            name={name}
            emoji={icon}
            fallbackIcon={faFileInvoice}
          />
        </StyledLink>
      </div>
      {description && (
        <div
          css={css`
            font-size: 0.8rem;
          `}
        >
          {description}
        </div>
      )}
    </>
  );
};
