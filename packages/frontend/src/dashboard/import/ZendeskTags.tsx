import { css } from '@emotion/react';

import { listFormat } from '@kenchi/ui/lib/utils/text';

import { ZendeskTagsConfig } from '../../tool/edit/AppActions/ZendeskTagsConfigurator';

const labelCss = css`
  font-weight: bold;
  font-size: 0.9em;
`;
const ZendeskTags = ({ tagsConfig }: { tagsConfig: ZendeskTagsConfig }) => {
  return (
    <>
      {tagsConfig.tagsToAdd ? (
        <li>
          <span css={labelCss}>Add tags:</span>{' '}
          <span>{listFormat(tagsConfig.tagsToAdd ?? [])}</span>
        </li>
      ) : null}{' '}
      {tagsConfig.tagsToSet ? (
        <li>
          <span css={labelCss}>Set tags: </span>{' '}
          <span>{listFormat(tagsConfig.tagsToSet ?? [])}</span>
        </li>
      ) : null}{' '}
      {tagsConfig.tagsToRemove ? (
        <li>
          <span css={labelCss}>Remove tags: </span>{' '}
          <span>{listFormat(tagsConfig.tagsToRemove ?? [])}</span>
        </li>
      ) : null}
    </>
  );
};

export default ZendeskTags;
