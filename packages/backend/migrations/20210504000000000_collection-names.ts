import { MigrationBuilder } from 'node-pg-migrate';

// Inverse of 20200807002549959_unique-collections-by-name
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP INDEX "idx_collection_unique_name_organization";
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE UNIQUE INDEX "idx_collection_unique_name_organization" ON collections (organization_id, name) WHERE (is_deleted = false);
  `);
}
