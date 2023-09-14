import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('widgets', {
    id: 'id',
    static_id: {
      type: 'string',
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
    is_latest: {
      type: 'boolean',
      notNull: true,
    },
    created_by_user_id: {
      type: 'string',
      notNull: true,
    },
    suggested_by_user_id: {
      type: 'string',
      notNull: false,
    },
    previous_version_id: {
      type: 'string',
      notNull: false,
    },
    major_change_description: {
      type: 'jsonb',
      notNull: false,
    },
    branched_from_id: {
      type: 'integer',
      notNull: false,
    },
    branch_type: {
      type: 'branch_type_enum',
      notNull: false,
    },
    branch_id: {
      type: 'string',
      notNull: false,
    },
    is_archived: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    organization_id: {
      type: 'integer',
      references: 'organizations',
      notNull: true,
    },
    metadata: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
    },
    contents: {
      type: 'jsonb',
      notNull: true,
    },
    inputs: {
      type: 'jsonb',
      notNull: true,
    },
  });
  pgm.addIndex('widgets', ['static_id', 'is_latest', 'branch_type']);
  pgm.addIndex('widgets', ['is_latest', 'branch_type', 'organization_id']);
  pgm.addIndex('widgets', 'static_id', {
    unique: true,
    where: "is_latest AND branch_type = 'published'::branch_type_enum",
  });
  pgm.addIndex('widgets', 'branch_id', {
    unique: true,
    where: "is_latest AND branch_type <> 'published'::branch_type_enum",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('widgets');
}
