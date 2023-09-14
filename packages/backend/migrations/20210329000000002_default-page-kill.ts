import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('organizations', 'default_page_static_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('organizations', {
    default_page_static_id: {
      type: 'character varying',
    },
  });
}
