import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('users', 'group_id');
  pgm.alterColumn('users', 'organization_id', { allowNull: true });
  pgm.alterColumn('collections', 'organization_id', { allowNull: true });

  pgm.addColumn('collections', {
    default_permissions: {
      type: 'character varying[]',
      notNull: true,
      default: '{}',
    },
  });

  pgm.createTable('collection_acl', {
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
    collection_id: {
      type: 'integer',
      references: 'collections',
      notNull: true,
    },
    user_id: { type: 'integer', references: 'users' },
    user_group_id: { type: 'integer', references: 'user_groups' },
    permissions: {
      type: 'character varying[]',
      notNull: true,
      default: '{}',
    },
  });
  pgm.createIndex('collection_acl', ['collection_id', 'user_id'], {
    name: `idx_collectionAcls_collection_user`,
    unique: true,
    where: `user_group_id IS NULL`,
  });
  pgm.createIndex('collection_acl', ['collection_id', 'user_group_id'], {
    name: `idx_collectionAcls_collection_userGroup`,
    unique: true,
    where: `user_id IS NULL`,
  });
  pgm.createConstraint(
    'collection_acl',
    'idx_collectionAcls_user_userGroup_xor',
    { check: 'num_nonnulls(user_id, user_group_id) = 1' }
  );
  pgm.sql(`
    INSERT INTO collection_acl (collection_id, user_group_id, permissions)
    SELECT c.id, ug.id, ug.permissions
    FROM user_groups ug
    LEFT JOIN collections c
      ON c.organization_id = ug.organization_id
  `);
  pgm.sql(`
    UPDATE user_groups
    SET permissions = '{"admin", "manage_org_shortcuts", "manage_users", "manage_collections"}'
    WHERE permissions = '{"admin"}'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('collection_acl');
  pgm.dropColumn('collections', 'default_permissions');
  pgm.alterColumn('collections', 'organization_id', { notNull: true });
  pgm.alterColumn('users', 'organization_id', { notNull: true });
  pgm.addColumn('users', {
    group_id: {
      type: 'integer',
      references: 'user_groups',
    },
  });
}
