import { css } from '@emotion/react';
import classNames from 'classnames/bind';

import { KenchiTheme } from '../Colors';

const cardTitle = ({ colors }: KenchiTheme) => css`
  font-size: 0.95em;
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 0.2rem 0.2rem;
  color: ${colors.gray[11]};
`;

const cardActions = css`
  font-size: 0.9em;
`;

const style = ({ colors }: KenchiTheme) => css`
  display: grid;
  gap: 0.25rem;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr;

  & > .card-header {
    display: flex;
    justify-content: space-between;
  }

  & > .card-body {
    &:nth-of-type(1) {
      grid-row: 1 / span 2;
    }

    padding: 0.5rem;
    border-radius: 0.3rem;
    border: 1px solid ${colors.gray[3]};
    color: ${colors.gray[12]};

    background: linear-gradient(
      217deg,
      ${colors.gray[0]},
      ${colors.gray[1]} 110.71%
    );
    box-shadow: 0px 0px 15px 0px ${colors.subtleShadow};

    &.full-bleed {
      padding: 0;
    }
  }
`;

type ContentCardProps = {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fullBleed?: boolean;
};

export default function ContentCard({
  title,
  actions,
  className,
  fullBleed,
  children,
}: ContentCardProps) {
  return (
    <div css={style} className={className}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h2 css={cardTitle}>{title}</h2>}
          {actions && <div css={cardActions}>{actions}</div>}
        </div>
      )}
      <div className={classNames('card-body', { 'full-bleed': fullBleed })}>
        {children}
      </div>
    </div>
  );
}
