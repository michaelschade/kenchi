import { pad } from 'lodash';
import {
  ExternalDataReference,
  ExternalReferenceTypeEnum,
  Prisma,
} from 'prisma-client';

import { getDB } from '../../../api/db';
import { generateStaticId } from '../../../api/utils';
import Factory from './factory';

const externalDataReferenceFactory = new (class extends Factory<
  Prisma.ExternalDataReferenceUncheckedCreateInput,
  ExternalDataReference
> {
  defaults({
    sequence,
    params,
  }: {
    sequence: number;
    params: Partial<Prisma.ExternalDataReferenceUncheckedCreateInput>;
  }) {
    if (!params.organizationId) {
      throw new Error('organizationId is required');
    }
    return {
      id: generateStaticId('edref'),
      referenceSource: 'intercom',
      referenceType: ExternalReferenceTypeEnum.tag,
      label: `Label ${sequence}`,
      referenceId: pad(`${sequence}`, 5, '0'),
      organizationId: params.organizationId,
    };
  }

  async persist(
    createParams: Prisma.ExternalDataReferenceUncheckedCreateInput
  ) {
    return getDB().externalDataReference.create({ data: createParams });
  }
})();

export default externalDataReferenceFactory;
