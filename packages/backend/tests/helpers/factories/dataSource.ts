import { DataSource, Prisma } from 'prisma-client';

import { getDB } from '../../../api/db';
import { generateStaticId } from '../../../api/utils';
import Factory from './factory';

const dataSourceFactory = new (class extends Factory<
  Prisma.DataSourceUncheckedCreateInput,
  DataSource
> {
  defaults({
    sequence,
    params,
  }: {
    sequence: number;
    params: Partial<Prisma.DataSourceUncheckedCreateInput>;
  }) {
    if (!params.organizationId) {
      throw new Error('organizationId is required');
    }
    return {
      id: generateStaticId('ds'),
      organizationId: params.organizationId,
      name: `Data Source ${sequence}`,
      // TODO: flesh this out once we have a concrete shape for requests and outputs
      requests: {},
      outputs: {},
    };
  }

  async persist(createParams: Prisma.DataSourceUncheckedCreateInput) {
    return getDB().dataSource.create({ data: createParams });
  }
})();

export default dataSourceFactory;
