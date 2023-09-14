import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('domains', {
    track_session: {
      type: 'boolean',
    },
  });
  pgm.createTable('session_entries', {
    id: 'id',
    received_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    user_id: {
      type: 'int',
      references: 'users',
    },
    browser_instance_id: {
      type: 'string',
      notNull: true,
    },
    timestamp: {
      type: 'timestamp',
      notNull: true,
    },
    action: {
      type: 'string',
      notNull: true,
    },
    window_id: {
      type: 'integer',
    },
    tab_id: {
      type: 'integer',
    },
    data: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('session_entries');
  pgm.dropColumn('domains', 'track_session');
}
