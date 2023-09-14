import { extendType, idArg, interfaceType, nonNull } from 'nexus';

import { decodeId, requireAdmin } from '../../utils';

export const AdminNode = interfaceType({
  name: 'AdminNode',
  resolveType: (item: any) => item.__typename,
  definition(t) {
    t.id('id');
  },
});

export const adminNode = extendType({
  type: 'Query',
  definition(t) {
    t.nullable.field('adminNode', {
      type: 'AdminNode',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        requireAdmin();
        let type: string;
        let idNum: number;
        try {
          const decoded = decodeId(id);
          type = decoded[0];
          idNum = decoded[1];
        } catch (e) {
          return null;
        }

        let obj;
        switch (type) {
          case 'A-trl':
            obj = await ctx.db.toolRunLog.findUnique({ where: { id: idNum } });
            if (!obj) {
              return null;
            }
            return {
              ...obj,
              __typename: 'ToolRunLog',
            };
          case 'A-ps':
            obj = await ctx.db.pageSnapshot.findUnique({
              where: { id: idNum },
            });
            if (!obj) {
              return null;
            }
            return {
              ...obj,
              __typename: 'PageSnapshot',
            };
          default:
            return null;
        }
      },
    });
  },
});
