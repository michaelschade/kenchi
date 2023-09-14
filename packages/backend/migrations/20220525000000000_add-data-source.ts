import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('data_sources', {
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
    name: {
      type: 'string',
      notNull: true,
    },
    requests: {
      type: 'jsonb',
      notNull: true,
    },
    outputs: {
      type: 'jsonb',
      notNull: true,
    },
  });
  pgm.addIndex('data_sources', ['organization_id', 'is_archived']);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('data_sources', ['organization_id', 'is_archived']);
  pgm.dropTable('data_sources');
}
