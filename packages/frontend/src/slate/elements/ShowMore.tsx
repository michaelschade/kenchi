import { createContext, useContext } from 'react';

import { css } from '@emotion/react';
import { faPlusSquare } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const style = css`
  white-space: nowrap;

  svg {
    cursor: pointer;
    color: hsla(209, 40%, 60%, 0.8);
    transition: color 0.1s ease-in-out;

    &:hover {
      color: hsl(211deg 100% 58%);
    }
  }
`;

const ShowMoreContext = createContext<null | (() => void)>(null);

export const ShowMoreProvider = ShowMoreContext.Provider;

export default function ShowMore() {
  const onClick = useContext(ShowMoreContext);
  if (!onClick) {
    throw new Error('ShowMore used without provider');
  }

  return (
    <span css={style}>
      … <FontAwesomeIcon icon={faPlusSquare} onClick={onClick} />
    </span>
  );
}
