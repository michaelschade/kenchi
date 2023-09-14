import { css } from '@emotion/react';

import { ZendeskTagsConfig } from '../../tool/edit/AppActions/ZendeskTagsConfigurator';
import ZendeskTags from './ZendeskTags';

const boldText = css`
  font-weight: bold;
  font-size: 0.9em;
`;

const ZendeskActions = ({
  tagsConfig,
  assign,
  setStatus,
}: {
  tagsConfig?: ZendeskTagsConfig;
  assign?: { userId: 'self' };
  setStatus?: string;
}) => {
  if (!tagsConfig && !assign && !setStatus) {
    return null;
  }
  return (
    <div>
      <h2>Zendesk actions</h2>
      <ul
        css={css`
          li {
            margin: 0px;
          }
        `}
      >
        {tagsConfig ? <ZendeskTags tagsConfig={tagsConfig} /> : null}
        {assign ? (
          <li>
            <span css={boldText}>Assign to:</span> current user
          </li>
        ) : null}
        {setStatus ? (
          <li>
            <span css={boldText}>Set status to:</span> {setStatus}
          </li>
        ) : null}
      </ul>
    </div>
  );
};
export default ZendeskActions;
