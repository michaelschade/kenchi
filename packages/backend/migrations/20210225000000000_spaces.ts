import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('spaces', {
    id: 'id',
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    created_by_user_id: { type: 'integer', notNull: true, references: 'users' },
    previous_version_id: { type: 'integer', references: 'spaces' },
    is_latest: { type: 'boolean', notNull: true },
    static_id: { type: 'varchar', notNull: true },
    is_deleted: { type: 'boolean', notNull: true, default: false },
    major_change_description: 'json',
    branched_from_id: { type: 'integer', references: 'spaces' },
    metadata: { type: 'json', notNull: true, default: '{}' }, // TODO: check if right
    suggested_by_user_id: { type: 'integer', references: 'users' },
    branch_type: { type: 'branch_type_enum', notNull: true },
    branch_id: 'character varying',
    group_id: { type: 'integer', notNull: true, references: 'user_groups' },
    widgets: { type: 'json', notNull: true },
    icon: { type: 'string' },
  });

  // CREATE INDEX "idx_spaces_staticId_isLatest_branchType" ON spaces(static_id text_ops,is_latest bool_ops,branch_type enum_ops);
  pgm.createIndex('spaces', ['static_id', 'is_latest', 'branch_type'], {
    name: `idx_spaces_staticId_isLatest_branchType`,
  });

  // CREATE UNIQUE INDEX "idx_spaces_unique_staticId_branchTypePublished" ON spaces(static_id text_ops) WHERE is_latest = true AND branch_type = 'published'::branch_type_enum;
  pgm.createIndex('spaces', 'static_id', {
    name: `idx_spaces_unique_staticId_branchTypePublished`,
    unique: true,
    where: `is_latest = true AND branch_type = 'published'`,
  });

  // CREATE UNIQUE INDEX "idx_spaces_unique_branchId_branchTypeUnpublished" ON spaces(branch_id text_ops) WHERE is_latest = true AND branch_type <> 'published'::branch_type_enum;
  pgm.createIndex('spaces', ['branch_id'], {
    name: `idx_spaces_unique_branchId_branchTypeUnpublished`,
    unique: true,
    where: `is_latest = true AND branch_type != 'published'`,
  });

  pgm.alterColumn('workflows', 'branch_id', { type: 'character varying' });
  pgm.alterColumn('tools', 'branch_id', { type: 'character varying' });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn('workflows', 'branch_id', { type: 'text' });
  pgm.alterColumn('tools', 'branch_id', { type: 'text' });
  pgm.dropTable('spaces');
}
