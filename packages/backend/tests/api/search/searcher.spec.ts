import { times } from 'lodash';

import { getDB } from '../../../api/db';
import initSearchClient from '../../../api/search/searchClient';
import { makeSearchKeyForUser } from '../../../api/search/searcher';
import { encodeId } from '../../../api/utils';
import collectionFactory from '../../helpers/factories/collection';
import userFactory from '../../helpers/factories/user';

jest.mock('../../../api/search/searchClient', () => {
  const mockReturn = {
    client: { generateSecuredApiKey: jest.fn() },
    index: jest.fn(),
  };
  return {
    __esModule: true,
    default: (_: string) => mockReturn,
  };
});
const generateSecuredApiKey =
  initSearchClient('IGNORED').client.generateSecuredApiKey;

describe('Generating a search key for a user', () => {
  it('constrains the search key to specific collections', async () => {
    // Some other user with access to some other collection
    await userFactory.create({
      collectionAcls: {
        create: [
          { collection: { create: await collectionFactory.createParams() } },
        ],
      },
    });

    const accessibleCollections = await Promise.all(
      times(3, async () => collectionFactory.createParams())
    );

    const user = await userFactory.create({
      collectionAcls: {
        create: accessibleCollections.map((collection) => ({
          collection: {
            create: collection,
          },
        })),
      },
    });

    // Collection IDs were auto-generated on create, need to fetch them from the DB
    const expectedFilters = (
      await getDB().collectionAcl.findMany({ where: { userId: user.id } })
    )
      .map((collection) => `collection.id:${encodeId('coll', collection.id)}`)
      .join(' OR ');

    await makeSearchKeyForUser(user);
    expect(generateSecuredApiKey).toBeCalledWith(
      expect.anything(), // this is the search API key
      expect.objectContaining({ filters: expectedFilters })
    );
  });
});
