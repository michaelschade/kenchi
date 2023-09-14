import { CollectionAcl, Prisma } from 'prisma-client';

import { getDB } from '../../../api/db';
import Factory from './factory';

const collectionAclFactory = new (class extends Factory<
  Prisma.CollectionAclUncheckedCreateInput,
  CollectionAcl
> {
  defaults({ sequence }: { sequence: number }) {
    return {
      permissions: [],
      userGroupId: null,
      userId: null,
      collectionId: sequence, // Assigning sequence is wrong but colletionId is required
    };
  }

  persist(createParams: Prisma.CollectionAclUncheckedCreateInput) {
    return getDB().collectionAcl.create({ data: createParams });
  }
})();

export default collectionAclFactory;
