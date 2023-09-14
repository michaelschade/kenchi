import { exec } from 'child_process';
import { extendType, objectType } from 'nexus';
import path from 'path';

import { requireAdmin } from '../../utils';

export const DatabaseMigration = objectType({
  name: 'DatabaseMigration',
  sourceType: '{name: string, runOn: Date | null}',
  definition(t) {
    t.string('id', { resolve: (dm) => dm.name });
    t.nullable.field('runOn', { type: 'DateTime' });
  },
});

export const UpgradeDBAdminMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('upgradeDB', {
      type: objectType({
        name: 'upgradeDBOutput',
        definition(t) {
          t.string('stdout');
          t.string('stderr');
        },
      }),
      resolve(_root, {}, _ctx) {
        requireAdmin();
        return new Promise((resolve) => {
          // Intentionally moving one directory up from admin.
          // Which means this task doesn't work in dev. :(
          const cwd = path.resolve(__dirname, '../../../../');

          exec(`pnpm --C ${cwd} migrate up`, (_error, stdout, stderr) => {
            resolve({ stdout, stderr });
          });
        });
      },
    });
  },
});
