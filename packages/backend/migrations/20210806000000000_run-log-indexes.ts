import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex('user_tool_runs', ['static_id', 'run_at']);
  pgm.createIndex('user_workflow_views', ['static_id', 'viewed_at']);
  pgm.createIndex('tools', [
    'is_latest',
    'is_deleted',
    'branch_type',
    'collection_id',
  ]);
  pgm.createIndex('workflows', [
    'is_latest',
    'is_deleted',
    'branch_type',
    'collection_id',
  ]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('workflows', [
    'is_latest',
    'is_deleted',
    'branch_type',
    'collection_id',
  ]);
  pgm.dropIndex('tools', [
    'is_latest',
    'is_deleted',
    'branch_type',
    'collection_id',
  ]);
  pgm.dropIndex('user_workflow_views', ['static_id', 'viewed_at']);
  pgm.dropIndex('user_tool_runs', ['static_id', 'run_at']);
}
