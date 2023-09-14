import { css } from '@emotion/react';
import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { KenchiTheme } from './Colors';
import Tooltip, { Placement } from './Tooltip';

const helpIcon = ({ colors }: KenchiTheme) => css`
  font-size: 0.9rem;
  margin-left: 7px;
  color: ${colors.gray[8]};
  transition: color 0.2s ease-in-out;

  &:hover {
    color: ${colors.gray[9]};
  }
`;

type Props = { placement?: Placement; content: React.ReactChild };

export const HelpIcon = ({ placement = 'right', content }: Props) => (
  <Tooltip
    // @ts-ignore no idea why this won't work in ui (works in frontend)
    css={helpIcon}
    mouseEnterDelay={0.2}
    placement={placement}
    overlay={content}
  >
    <FontAwesomeIcon icon={faInfoCircle} />
  </Tooltip>
);
