import { css } from '@emotion/react';
import { faExternalLinkAlt } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { DangerButton, SecondaryButton } from '@kenchi/ui/lib/Button';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

type Props = {
  onClickEdit?: () => void;
  onClickRemove: () => void;
  linkDisplayText: string;
  linkTo: string;
};

export const SelectedElementPopoverContent = ({
  onClickEdit,
  onClickRemove,
  linkDisplayText,
  linkTo,
}: Props) => {
  return (
    <div
      css={css`
        display: grid;
        gap: 1rem;
        width: 16rem;
        padding: 0.25rem;
      `}
    >
      <UnstyledLink
        css={css`
          align-items: center;
          display: inline-grid;
          gap: 0.5rem;
          grid-template-columns: auto 1fr;
          width: 100%;
          font-size: 0.95rem;
        `}
        to={linkTo}
        target="_blank"
      >
        <span
          css={css`
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          `}
        >
          {linkDisplayText}
        </span>
        <FontAwesomeIcon icon={faExternalLinkAlt} size="sm" />
      </UnstyledLink>
      <div
        css={css`
          display: grid;
          gap: 0.75rem;
          grid-template-columns: ${onClickEdit ? '1fr 1fr' : '1fr'};
        `}
      >
        {onClickEdit && (
          <SecondaryButton size="small" onClick={onClickEdit}>
            Edit
          </SecondaryButton>
        )}
        <DangerButton size="small" onClick={onClickRemove}>
          Remove
        </DangerButton>
      </div>
    </div>
  );
};
