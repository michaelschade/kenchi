import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn('shortcuts', 'organization_id', { allowNull: true });
  pgm.sql(`
    UPDATE shortcuts
    SET organization_id = NULL
    WHERE user_id IS NOT NULL
  `);
  pgm.createIndex('shortcuts', ['organization_id', 'static_id'], {
    name: 'idx_shortcuts_unique_staticId_organizationId',
    unique: true,
    where: `user_id IS NULL`,
  });
  pgm.createIndex('shortcuts', ['user_id', 'static_id'], {
    name: 'idx_shortcuts_unique_staticId_userId',
    unique: true,
    where: `organization_id IS NULL`,
  });
  pgm.createIndex('shortcuts', ['organization_id', 'shortcut'], {
    name: 'idx_shortcuts_unique_shortcut_organizationId',
    unique: true,
    where: `user_id IS NULL`,
  });
  pgm.createIndex('shortcuts', ['user_id', 'shortcut'], {
    name: 'idx_shortcuts_unique_shortcut_userId',
    unique: true,
    where: `organization_id IS NULL`,
  });
  pgm.addConstraint(
    'shortcuts',
    'idx_shortcuts_check_xor_organizationId_userId',
    { check: `NUM_NONNULLS(organization_id, user_id) = 1` }
  );
  pgm.dropIndex('shortcuts', [], {
    name: 'idx_shortcuts_unique_staticId_without_userId',
  });
  pgm.dropIndex('shortcuts', [], {
    name: 'idx_shortcuts_unique_staticId_with_userId',
  });
  pgm.dropIndex('shortcuts', [], {
    name: 'idx_shortcuts_unique_shortcut_without_userId',
  });
  pgm.dropIndex('shortcuts', [], {
    name: 'idx_shortcuts_unique_shortcut_with_userId',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE shortcuts AS s
    SET organization_id = u.organization_id
    FROM users u
    WHERE s.user_id = u.id AND s.user_id IS NOT NULL;
  `);
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
  pgm.dropIndex('shortcuts', [], {
    name: 'idx_shortcuts_unique_staticId_organizationId',
  });
  pgm.dropIndex('shortcuts', [], {
    name: 'idx_shortcuts_unique_staticId_userId',
  });
  pgm.dropIndex('shortcuts', [], {
    name: 'idx_shortcuts_unique_shortcut_organizationId',
  });
  pgm.dropIndex('shortcuts', [], {
    name: 'idx_shortcuts_unique_shortcut_userId',
  });
  pgm.alterColumn('shortcuts', 'organization_id', { notNull: true });
}
