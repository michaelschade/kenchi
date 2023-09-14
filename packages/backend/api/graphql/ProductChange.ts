import { objectType } from 'nexus';
import { ProductChange as Fields } from 'nexus-prisma';

import { idResolver } from '../utils';

export const ProductChange = objectType({
  name: 'ProductChange',
  definition(t) {
    t.implements('Node');
    t.id('id', idResolver('chng'));
    t.field(Fields.title);
    t.field('description', { type: 'SlateNodeArray' });
    t.field(Fields.isMajor);
    t.field(Fields.createdAt);
    t.nullable.field('notification', {
      type: 'Notification',
      resolve(pc, {}, ctx) {
        const idString = idResolver('chng').resolve(pc);
        return ctx.db.notification.findFirst({ where: { staticId: idString } });
      },
    });
  },
});
