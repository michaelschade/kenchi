import { nullable, objectType } from 'nexus';
import { ToolRunLog as Fields } from 'nexus-prisma';

import { idResolver } from '../../utils';

export const ToolRunLog = objectType({
  name: 'ToolRunLog',
  definition(t) {
    t.implements('AdminNode');

    t.id('id', idResolver('A-trl'));
    t.field(Fields.createdAt);
    t.field({
      ...Fields.tool,
      type: nullable('ToolRevision'),
    });
    t.field(Fields.user);
    t.field('log', { type: 'Json' });
  },
});
