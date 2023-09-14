import { objectType } from 'nexus';
import { PageSnapshot as Fields } from 'nexus-prisma';

import { idResolver } from '../../utils';

export const PageSnapshot = objectType({
  name: 'PageSnapshot',
  definition(t) {
    t.implements('AdminNode');

    t.id('id', idResolver('A-ps'));
    t.field(Fields.createdAt);
    t.field(Fields.user);
    t.field('snapshot', { type: 'Json' });
  },
});
