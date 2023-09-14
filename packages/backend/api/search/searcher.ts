import { map } from 'lodash';
import { User } from 'prisma-client';

import { getDB } from '../db';
import { visibleCollectionsQuery } from '../graphql/Collection';
import { encodeId } from '../utils';
import initSearchClient, { SearchAPIClient } from './searchClient';

// Arbitrarily choosing 30 minutes
const SEARCH_KEY_VALIDITY_SECONDS = 30 * 60;
export const getSearchKeyValidUntil = () => {
  return Math.floor(Date.now() / 1000) + SEARCH_KEY_VALIDITY_SECONDS;
};

const { client } = initSearchClient(process.env.ALGOLIA_SEARCH_APIKEY);

function generateSearchKey(
  client: Pick<SearchAPIClient, 'generateSecuredApiKey'>,
  collectionIds: number[]
) {
  // Collection filter looks like "collection.id:coll_<alphanumeric>> OR collection.id:coll_<alphanumeric> ..."
  const filters = collectionIds
    .map((id) => `collection.id:${encodeId('coll', id)}`)
    .join(' OR ');
  const validUntil = getSearchKeyValidUntil();
  return client.generateSecuredApiKey(process.env.ALGOLIA_SEARCH_APIKEY, {
    filters,
    validUntil,
    restrictIndices: process.env.ALGOLIA_SEARCH_INDEX_NAME,
  });
}

export async function makeSearchKeyForUser(user: User) {
  const collectionIds = map(
    await getDB().collection.findMany({
      select: { id: true },
      where: visibleCollectionsQuery(user),
    }),
    'id'
  );

  return generateSearchKey(client, collectionIds);
}

export async function searchDoNotUse(query: string, collectionIds: number[]) {
  const apiKey = generateSearchKey(client, collectionIds || []);
  const { index } = initSearchClient(apiKey);

  return await index.search(query);
}
