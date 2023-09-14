import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('user_tool_use_counts');
  pgm.dropTable('user_workflow_view_counts');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('user_workflow_view_counts', {
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    user_id: {
      type: 'integer',
      primaryKey: true,
      references: 'users',
    },
    workflow_static_id: {
      type: 'string',
      notNull: true,
      primaryKey: true,
    },
    date: {
      type: 'date',
      notNull: true,
      primaryKey: true,
    },
    count: {
      type: 'integer',
      notNull: true,
    },
  });
  pgm.createTable('user_tool_use_counts', {
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    user_id: {
      type: 'integer',
      references: 'users',
      primaryKey: true,
    },
    tool_static_id: {
      type: 'string',
      notNull: true,
      primaryKey: true,
    },
    date: {
      type: 'date',
      notNull: true,
      primaryKey: true,
    },
    count: {
      type: 'integer',
      notNull: true,
    },
  });
}
