import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn('spaces', 'group_id', { allowNull: true });
  pgm.addColumn('spaces', {
    organization_id: { type: 'integer', references: 'organizations' },
    visible_to_org: { type: 'boolean', notNull: true, default: false },
  });

  pgm.createTable('space_acl', {
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
    static_id: {
      type: 'character varying',
      notNull: true,
    },
    user_id: { type: 'integer', references: 'users' },
    user_group_id: { type: 'integer', references: 'user_groups' },
  });
  pgm.createIndex('space_acl', ['static_id', 'user_id'], {
    name: `idx_spaceAcl_collection_user`,
    unique: true,
    where: `user_group_id IS NULL`,
  });
  pgm.createIndex('space_acl', ['static_id', 'user_group_id'], {
    name: `idx_spaceAcl_collection_userGroup`,
    unique: true,
    where: `user_id IS NULL`,
  });
  pgm.createConstraint('space_acl', 'idx_spaceAcl_user_userGroup_xor', {
    check: 'num_nonnulls(user_id, user_group_id) = 1',
  });
  pgm.sql(`
    INSERT INTO space_acl (static_id, user_group_id)
    SELECT s.static_id, s.group_id
    FROM spaces s
    WHERE s.is_latest AND s.group_id IS NOT NULL
  `);

  pgm.sql(`
    UPDATE spaces AS s
    SET organization_id = ug.organization_id
    FROM user_groups ug
    WHERE s.group_id = ug.id
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('space_acl');
  pgm.dropColumn('spaces', ['organization_id', 'visible_to_org']);
  pgm.alterColumn('spaces', 'group_id', { allowNull: false });
}
