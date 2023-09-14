import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('notifications', {
    id: {
      type: 'string',
      primaryKey: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    organization_id: {
      type: 'integer',
      references: 'organizations',
    },
    type: {
      type: 'string',
      notNull: true,
    },
    static_id: {
      type: 'string',
    },
    data: {
      type: 'jsonb',
      default: '{}',
      notNull: true,
    },
  });

  pgm.createTable('user_notifications', {
    id: {
      type: 'string',
      primaryKey: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
    },
    notification_id: {
      type: 'string',
      notNull: true,
      references: 'notifications',
    },
    dismissed_at: {
      type: 'timestamp',
    },
    viewed_at: {
      type: 'timestamp',
    },
  });

  pgm.createTable('user_subscriptions', {
    user_id: {
      type: 'integer',
      references: 'users',
      primaryKey: true,
    },
    static_id: {
      type: 'string',
      primaryKey: true,
    },
    subscribed: {
      type: 'boolean',
      notNull: true,
    },
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
  });

  pgm.sql(`
    INSERT INTO user_subscriptions (user_id, static_id, subscribed)
    SELECT user_id, static_id, true FROM user_change_views WHERE static_id IS NOT NULL
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('user_subscriptions');
  pgm.dropTable('user_notifications');
  pgm.dropTable('notifications');
}
