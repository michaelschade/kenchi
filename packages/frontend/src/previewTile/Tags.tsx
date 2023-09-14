import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { capitalize } from 'lodash';

import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import Emoji from '@kenchi/ui/lib/Emoji';

const collectionTagStyle = ({ colors }: KenchiTheme) => css`
  background-color: ${colors.gray[4]};

  .icon {
    margin-right: 0.5em;
  }
`;

interface Collection {
  __typename: 'Collection';
  name: string;
  icon: string | null;
}

export function CollectionTag({ collection }: { collection: Collection }) {
  return (
    <li css={collectionTagStyle}>
      {collection.icon && <Emoji emoji={collection.icon} className="icon" />}
      {collection.name}
    </li>
  );
}

const itemTagStyle = ({ colors }: KenchiTheme) => css`
  background-color: ${colors.accent[4]};
`;

export function ItemTypeTag({
  itemType,
}: {
  itemType: 'playbook' | 'snippet' | 'collection';
}) {
  return <li css={itemTagStyle}>{capitalize(itemType)}</li>;
}

const Tags = styled.ul`
  display: inline-flex;
  margin: 0.25rem 0;
  gap: 0.25rem;
  padding: 0;
  list-style-type: none;
  font-size: 0.6em;
  line-height: 0.6;
  flex-wrap: nowrap;
  max-width: 100%;

  li {
    display: inline-block;
    margin: 0;
    padding: 0.3rem 0.4rem;
    border-radius: 0.5rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;

    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray[11]};
  }
`;

export default Tags;
