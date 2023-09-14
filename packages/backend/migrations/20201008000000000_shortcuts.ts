import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('shortcuts', {
    id: 'id',
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
    organization_id: {
      type: 'integer',
      notNull: true,
      references: 'organizations',
    },
    user_id: {
      type: 'integer',
      references: 'users',
    },
    static_id: {
      type: 'string',
      notNull: true,
    },
    shortcut: {
      type: 'string',
    },
  });
  pgm.createIndex('shortcuts', ['organization_id', 'static_id'], {
    name: 'idx_shortcuts_unique_staticId_without_userId',
    unique: true,
    where: `user_id IS NULL`,
  });
  pgm.createIndex('shortcuts', ['organization_id', 'user_id', 'static_id'], {
    name: 'idx_shortcuts_unique_staticId_with_userId',
    unique: true,
  });
  pgm.createIndex('shortcuts', ['organization_id', 'shortcut'], {
    name: 'idx_shortcuts_unique_shortcut_without_userId',
    unique: true,
    where: `user_id IS NULL`,
  });
  pgm.createIndex('shortcuts', ['organization_id', 'user_id', 'shortcut'], {
    name: 'idx_shortcuts_unique_shortcut_with_userId',
    unique: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('shortcuts');
}
