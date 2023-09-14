import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('notifications', 'organization_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('notifications', {
    organization_id: {
      type: 'integer',
      references: 'organizations',
    },
  });
}
