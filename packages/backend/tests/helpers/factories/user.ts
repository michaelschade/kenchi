import { Prisma, User, UserTypeEnum } from 'prisma-client';

import { getDB } from '../../../api/db';
import Factory from './factory';
import organizationFactory from './organization';

const userFactory = new (class extends Factory<
  Prisma.UserUncheckedCreateInput,
  User
> {
  async defaults({
    sequence,
    params,
  }: {
    sequence: number;
    params: Partial<Prisma.UserUncheckedCreateInput>;
  }) {
    return {
      organizationId:
        params.organizationId ??
        (await organizationFactory.create({ shadowRecord: true })).id,
      email: `test_user${sequence}@example.com`,
      isOrganizationAdmin: false,
      givenName: `Human${sequence}`,
      googleId: `${1000000 + sequence}`,
      name: `Humanbeing${sequence} Surname${sequence}`,
      disabledAt: null,
      userinfoFirst: {
        name: `Humanbeing${sequence} Surname${sequence}`,
        email: `test_user${sequence}@example.com`,
        given_name: `Human${sequence}`,
      },
      wantsEditSuggestionEmails: true,
      type: UserTypeEnum.user,
    };
  }

  persist(createParams: Prisma.UserUncheckedCreateInput) {
    return getDB().user.create({ data: createParams });
  }
})();

export default userFactory;
