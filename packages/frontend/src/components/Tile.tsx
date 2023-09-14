import { css } from '@emotion/react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faArrowCircleRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';

const wrapper = ({ colors }: KenchiTheme) => css`
  cursor: pointer;
  position: relative;
  border: 1px solid ${colors.gray[6]};
  background: ${colors.gray[2]};
  padding: 30px 15px 27px 15px;
  margin: 15px auto;
  text-align: center;
  width: 95%;

  &:first-of-type {
    margin-top: 0;
  }

  &:last-of-type {
    margin-bottom: 0;
  }

  .icon {
    color: ${colors.gray[12]};
  }

  .select {
    position: absolute;
    color: ${colors.accent[9]};
    bottom: 7px;
    visibility: hidden;
  }

  &:hover {
    text-decoration: none;
    box-shadow: 0px 0px 10px 0px ${colors.subtleShadow};

    .select {
      visibility: visible;
    }
  }

  &:active {
    box-shadow: inset 0px 0px 10px -1px ${colors.subtleShadow};

    .select {
      color: #0071ea;
    }
  }

  span.title {
    display: block;
    font-size: 1.3em;
    font-weight: 700;
    margin-top: 20px;
    margin-bottom: 5px;
    color: ${colors.gray[12]};
  }

  p {
    color: ${colors.gray[11]};
    line-height: 1.4;
    font-size: 0.9em;
    margin-bottom: 0;
    text-align: justify;
  }
`;

type TileProps = {
  onClick: () => void;
  title: string;
  description?: string;
  icon: IconProp;
};
export default function Tile({
  onClick,
  title,
  description = '',
  icon,
}: TileProps) {
  return (
    <div onClick={onClick} css={wrapper}>
      {icon && <FontAwesomeIcon icon={icon} className="icon" size="3x" />}
      <span className="title">{title}</span>
      {description ? <p>{description}</p> : ''}
      <FontAwesomeIcon icon={faArrowCircleRight} className="select" />
    </div>
  );
}
