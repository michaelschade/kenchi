import { Organization, Prisma } from 'prisma-client';

import { getDB } from '../../../api/db';
import Factory from './factory';

const organizationFactory = new (class extends Factory<
  Prisma.OrganizationUncheckedCreateInput,
  Organization
> {
  defaults({ sequence }: { sequence: number }) {
    return {
      googleDomain: null,
      additionalGoogleDomains: [],
      name: `Organization ${sequence}`,
      settings: {},
      shadowRecord: false,
    };
  }

  persist(createParams: Prisma.OrganizationUncheckedCreateInput) {
    return getDB().organization.create({ data: createParams });
  }
})();

export default organizationFactory;
