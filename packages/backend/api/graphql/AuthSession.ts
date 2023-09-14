import { objectType } from 'nexus';
import { AuthSession as Fields } from 'nexus-prisma';

export const AuthSession = objectType({
  name: 'AuthSession',
  definition(t) {
    t.implements('Node');

    t.id('id', { resolve: ({ id }) => id });
    t.field(Fields.expiresAt);
    t.field(Fields.type);
  },
});
