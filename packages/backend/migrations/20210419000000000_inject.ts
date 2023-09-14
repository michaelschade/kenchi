import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('domains', { inject: 'boolean' });
  pgm.sql(
    `UPDATE domains SET inject = true WHERE organization_id IS NULL AND default_interface = 'gmail'`
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('domains', 'inject');
}
