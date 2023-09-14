import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex('tools', ['is_latest', 'branch_type', 'collection_id']);
  pgm.createIndex('workflows', ['is_latest', 'branch_type', 'collection_id']);

  pgm.dropIndex('tools', [
    'is_latest',
    'is_deleted',
    'branch_type',
    'collection_id',
  ]);
  pgm.dropIndex('workflows', [
    'is_latest',
    'is_deleted',
    'branch_type',
    'collection_id',
  ]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex('workflows', [
    'is_latest',
    'is_deleted',
    'branch_type',
    'collection_id',
  ]);
  pgm.createIndex('tools', [
    'is_latest',
    'is_deleted',
    'branch_type',
    'collection_id',
  ]);
  pgm.dropIndex('tools', ['is_latest', 'branch_type', 'collection_id']);
  pgm.dropIndex('workflows', ['is_latest', 'branch_type', 'collection_id']);
}
