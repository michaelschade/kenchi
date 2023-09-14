import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('tool_run_logs', {
    id: 'id',
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    user_id: {
      type: 'integer',
      references: 'users',
    },
    tool_id: {
      type: 'integer',
      references: 'tools',
    },
    log: {
      type: 'json',
      notNull: true,
    },
  });
  pgm.createTable('page_snapshots', {
    id: 'id',
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    user_id: {
      type: 'integer',
      references: 'users',
    },
    snapshot: {
      type: 'json',
      notNull: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('page_snapshots');
  pgm.dropTable('tool_run_logs');
}
