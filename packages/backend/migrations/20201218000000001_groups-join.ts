import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('user_group_members', {
    user_id: { primaryKey: true, type: 'integer', references: 'users' },
    user_group_id: {
      primaryKey: true,
      type: 'integer',
      references: 'user_groups',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
  pgm.sql(`
    INSERT INTO user_group_members (user_id, user_group_id)
    SELECT id, group_id
    FROM users
    WHERE group_id IS NOT NULL
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('user_group_members');
}
