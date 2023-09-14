import { pad } from 'lodash';
import { ExternalTag, Prisma } from 'prisma-client';

import { getDB } from '../../../api/db';
import { generateStaticId } from '../../../api/utils';
import Factory from './factory';

const externalTagFactory = new (class extends Factory<
  Prisma.ExternalTagUncheckedCreateInput,
  ExternalTag
> {
  defaults({
    sequence,
    params,
  }: {
    sequence: number;
    params: Partial<Prisma.ExternalTagUncheckedCreateInput>;
  }) {
    if (!params.organizationId) {
      throw new Error('organizationId is required');
    }
    return {
      id: generateStaticId('etag'),
      label: `Label ${sequence}`,
      intercomId: pad(`${sequence}`, 5, '0'),
      organizationId: params.organizationId,
    };
  }

  async persist(createParams: Prisma.ExternalTagUncheckedCreateInput) {
    return getDB().externalTag.create({ data: createParams });
  }
})();

export default externalTagFactory;
