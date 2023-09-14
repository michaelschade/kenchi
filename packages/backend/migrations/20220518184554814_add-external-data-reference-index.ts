import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex('external_data_references', [
    'organization_id',
    'is_archived',
    'reference_source',
    'reference_type',
  ]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('external_data_references', [
    'organization_id',
    'is_archived',
    'reference_source',
    'reference_type',
  ]);
}
