import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('external_tags', {
    id: {
      type: 'string',
      primaryKey: true,
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
    is_archived: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    organization_id: {
      type: 'integer',
      references: 'organizations',
    },
    label: {
      type: 'string',
      notNull: true,
    },
    intercom_id: {
      type: 'string',
    },
  });
  pgm.addIndex('external_tags', 'organization_id', {
    name: 'idx_external_tags_organization_id',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('external_tags');
}
