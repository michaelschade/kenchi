import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    ALTER TABLE tools ALTER COLUMN collection_id DROP NOT NULL;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE tools AS t
      SET collection_id = c.id
      FROM collections c
      WHERE c.organization_id = t.owning_organization_id AND c.is_default AND t.collection_id is null;

    ALTER TABLE tools ALTER COLUMN collection_id SET NOT NULL;
  `);
}
