import { Fragment, useEffect, useRef, useState } from 'react';

import { css } from '@emotion/react';
import classNames from 'classnames/bind';

const style = css`
  height: 90px;
  position: absolute;
  z-index: 3;

  &.sticky {
    top: 0;
    position: fixed;
    width: 298px;
  }

  &.placeholder {
    position: relative;
    z-index: 2;
  }

  color: #fffcff;
  width: 100%;
  padding: 10px;
  font-size: 0.9rem;
  line-height: 1.75;
  text-align: center;
  box-shadow: inset 0 5px 10px -5px #20303cad;
  background: linear-gradient(217deg, #775c79, #483d50 110.71%);

  span,
  a {
    color: #fffcff;
    font-weight: 600;
    cursor: pointer;
  }

  span:hover,
  a:hover {
    font-weight: 700;
  }

  svg {
    font-size: 0.85rem;
  }
`;

export default function MajorAlert({
  sticky,
  children,
}: {
  sticky: boolean;
  children: React.ReactNode;
}) {
  const [stickySearch, setStickySearch] = useState(false);

  // Sticky update bar
  const placeholderUpdateRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sticky) {
      return;
    }
    const updateSticky = () => {
      if (placeholderUpdateRef.current) {
        setStickySearch(
          window.pageYOffset >
            placeholderUpdateRef.current.getBoundingClientRect().bottom
        );
      }
    };
    updateSticky();
    window.addEventListener('scroll', updateSticky);
    return () => {
      window.removeEventListener('scroll', updateSticky);
    };
  }, [sticky]);
  const placeholderUpdate = (
    <div ref={placeholderUpdateRef} css={style} className="placeholder" />
  );

  return (
    <Fragment>
      <div css={style} className={classNames({ sticky: stickySearch })}>
        {children}
      </div>
      {placeholderUpdate}
    </Fragment>
  );
}
