import { Collection, Prisma } from 'prisma-client';

import { getDB } from '../../../api/db';
import Factory from './factory';

const collectionFactory = new (class extends Factory<
  Prisma.CollectionUncheckedCreateInput,
  Collection
> {
  defaults({ sequence }: { sequence: number }) {
    return {
      name: `collection ${sequence}`,
      icon: null,
      description: `Telling you all about collection ${sequence}`,
      isArchived: false,
      organizationId: null,
      defaultPermissions: [],
    };
  }

  async persist(createParams: Prisma.CollectionUncheckedCreateInput) {
    return getDB().collection.create({ data: createParams });
  }
})();

export default collectionFactory;
