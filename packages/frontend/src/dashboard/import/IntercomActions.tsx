import { css } from '@emotion/react';

import { pluralize } from '../../utils';

const boldText = css`
  font-weight: bold;
  font-size: 0.9em;
`;

const IntercomActions = ({ tags }: { tags?: string[] }) => {
  if (!tags || tags.length === 0) {
    return null;
  }
  return (
    <div>
      <h2>Intercom actions</h2>
      <ul
        css={css`
          li {
            margin: 0px;
          }
        `}
      >
        <li>
          <span css={boldText}>Add {pluralize(tags.length, 'tag')}</span>
        </li>
      </ul>
    </div>
  );
};
export default IntercomActions;
