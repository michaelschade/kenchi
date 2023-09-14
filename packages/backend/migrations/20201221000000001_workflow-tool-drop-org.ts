import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('tools', 'owning_organization_id');
  pgm.dropColumn('workflows', 'owning_organization_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('tools', {
    owning_organization_id: { type: 'integer', references: 'organizations' },
  });
  pgm.addColumn('workflows', {
    owning_organization_id: { type: 'integer', references: 'organizations' },
  });

  pgm.sql(`
    UPDATE tools t
    SET t.owning_organization_id = c.organization_id
    FROM collections c
    WHERE t.collection_id = c.id
  `);
  pgm.sql(`
    UPDATE workflows t
    SET t.owning_organization_id = c.organization_id
    FROM collections c
    WHERE t.collection_id = c.id
  `);
}
