import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    INSERT INTO collections (name, organization_id)
    SELECT 'Uncategorized', o.id
    FROM organizations o LEFT JOIN collections c ON c.name = 'Uncategorized' AND c.organization_id = o.id
    WHERE c.id IS NULL
  `);
  pgm.sql(`
    UPDATE tools t
    SET collection_id = c.id
    FROM collections c
    WHERE
      t.collection_id IS NULL AND
      c.organization_id = t.owning_organization_id AND
      c.name = 'Uncategorized'
  `);
  pgm.sql(`
    UPDATE workflows w
    SET collection_id = c.id
    FROM collections c
    WHERE
      w.collection_id IS NULL AND
      c.organization_id = w.owning_organization_id AND
      c.name = 'Uncategorized'
  `);
  pgm.alterColumn('tools', 'collection_id', { notNull: true });
  pgm.alterColumn('workflows', 'collection_id', { notNull: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn('tools', 'collection_id', { allowNull: true });
  pgm.alterColumn('workflows', 'collection_id', { allowNull: true });

  // Sorry, not undoing the collections changes automatically
}
