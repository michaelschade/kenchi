import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('spaces', 'group_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('spaces', {
    group_id: { type: 'integer', references: 'user_groups' },
  });
}
