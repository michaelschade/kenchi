import { css } from '@emotion/react';

import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { Link } from '@kenchi/ui/lib/Text';

const style = css`
  svg {
    margin: 5px 0;
  }

  .prev {
    float: left;
  }

  .next {
    float: right;
  }

  .clear {
    clear: both;
  }
`;

export default function Pagination({
  onPrev,
  onNext,
  loadingDir,
}: {
  onPrev?: false | (() => void);
  onNext?: false | (() => void);
  loadingDir?: 'prev' | 'next';
}) {
  if (!onPrev && !onNext && !loadingDir) {
    return null;
  }
  return (
    <div css={style}>
      {loadingDir && (
        <LoadingSpinner name="pagination" className={loadingDir} />
      )}
      {!loadingDir && (
        <>
          {onPrev && (
            <Link className="prev" onClick={onPrev}>
              « Prev
            </Link>
          )}
          {onNext && (
            <Link className="next" onClick={onNext}>
              Next »
            </Link>
          )}
        </>
      )}
      <div className="clear" />
    </div>
  );
}
