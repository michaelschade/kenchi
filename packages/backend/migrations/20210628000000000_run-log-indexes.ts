import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex('user_tool_runs', ['run_at']);
  pgm.createIndex('user_tool_runs', ['user_id', 'run_at']);

  pgm.createIndex('user_workflow_views', ['viewed_at']);
  pgm.createIndex('user_workflow_views', ['user_id', 'viewed_at']);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('user_workflow_views', ['user_id', 'viewed_at']);
  pgm.dropIndex('user_workflow_views', ['viewed_at']);

  pgm.dropIndex('user_tool_runs', ['user_id', 'run_at']);
  pgm.dropIndex('user_tool_runs', ['run_at']);
}
