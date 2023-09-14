import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE tools AS t
      SET collection_id = null
      FROM collections c
      WHERE c.organization_id = t.owning_organization_id AND c.is_default AND t.collection_id = c.id;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE tools AS t
      SET collection_id = c.id
      FROM collections c
      WHERE c.organization_id = t.owning_organization_id AND c.is_default AND t.collection_id is null;
  `);
}
