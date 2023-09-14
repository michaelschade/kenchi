import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn('workflows', 'collection_id', { notNull: false });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Inconsistent orgs...
  pgm.sql(`
    UPDATE workflows SET collection_id = 1 WHERE collection_id IS NULL
  `);
  pgm.alterColumn('workflows', 'collection_id', { notNull: true });
}
