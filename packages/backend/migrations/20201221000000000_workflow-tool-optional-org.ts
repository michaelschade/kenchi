import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn('tools', 'owning_organization_id', { allowNull: true });
  pgm.alterColumn('workflows', 'owning_organization_id', { allowNull: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE tools t
    SET t.owning_organization_id = c.organization_id
    FROM collections c
    WHERE t.collection_id = c.id AND t.owning_organization_id IS NULL
  `);
  pgm.sql(`
    UPDATE workflows t
    SET t.owning_organization_id = c.organization_id
    FROM collections c
    WHERE t.collection_id = c.id AND t.owning_organization_id IS NULL
  `);

  pgm.alterColumn('tools', 'owning_organization_id', { notNull: true });
  pgm.alterColumn('workflows', 'owning_organization_id', { notNull: true });
}
