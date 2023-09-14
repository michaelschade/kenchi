import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('user_item_settings', {
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
    static_id: {
      type: 'string',
      primaryKey: true,
    },
    data: {
      type: 'jsonb',
      default: '{}',
      notNull: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('user_item_settings');
}
